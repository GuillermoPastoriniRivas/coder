import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StateGraph } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { tool } from '@langchain/core/tools';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import { MongoClient } from 'mongodb';
import { z } from 'zod';
import axios from 'axios';
import 'dotenv/config';


// OLD
// interface Conversation {
//     phone: string;
//     owner: string;
//     messages: Message[];
// }

// interface Message {
//     role: 'user' | 'assistant' | 'system';
//     content: string;
//     timestamp: Date;
// }

// interface Agent {
//     owner: string;
//     description: string;
// }

// NEW
interface Conversation {
    phone: string;
    agent: Agent; 
    messages: Message[];
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface Agent {
    name: string; //unique
    owner: string;
    context: string;
    tools: Tool[];
    openAI: OpenAI;
}

interface Tool {
    name: string; //unique
}

interface OpenAI {
    apiKey: string; 
    model: string;
}

const getAvailableSlotsTool = tool(
  async () => {
      // const response = await axios.get("https://api.example.com/get-available-slots");
      // return response.data;

      return JSON.stringify([
          { time: '10:00', date: '2024-12-02' },
          { time: '11:00', date: '2024-12-02' },
          { time: '12:00', date: '2024-12-02' }
      ]);
  },
  {
      name: 'get_available_slots',
      description: 'Fetches available appointment slots',
      schema: z.object({})
  }
);

const confirmDateTool = tool(
  async ({ slot }: { slot: string }) => {
      return `Confirming appointment for slot: ${slot}`;
  },
  {
      name: 'confirm_date',
      description: 'Confirms an appointment slot with the user',
      schema: z.object({
          slot: z.string().describe('The selected slot to confirm')
      })
  }
);

const setAppointmentTool = tool(
  async ({ slot, user }: { slot: string; user: string }) => {
      // const response = await axios.post("https://api.example.com/set-appointment", { slot, user });
      // return response.data;

      return { message: 'Appointment saved successfully' };
  },
  {
      name: 'set_appointment',
      description: 'Sets an appointment in the system',
      schema: z.object({
          slot: z.string().describe('The slot to book'),
          user: z.string().describe("The user's identifier")
      })
  }
);

export async function callAgent(client: MongoClient, query: string, phone: string, owner: string) {
    const dbName = 'xenio';
    const db = client.db(dbName);
    const conversationsCollection = db.collection<Conversation>('conversations');
    const configCollection = db.collection<Agent>('agentConfigs');

    const agentConfig = (await configCollection.findOne({ owner })) || {
        description:
            'You are an AI assistant that helps with scheduling appointments. Use the tools available to check slots, confirm appointments, and set them. You should kindly guide the user through the process of scheduling appointments.'
    };

    const tools = [getAvailableSlotsTool, confirmDateTool, setAppointmentTool];

    const message: Message = {
        role: 'user',
        content: query,
        timestamp: new Date()
    };

    await conversationsCollection.updateOne({ phone, owner }, { $push: { messages: message } }, { upsert: true });

    const GraphState = Annotation.Root({
        messages: Annotation<BaseMessage[]>({
            reducer: (x, y) => x.concat(y)
        })
    });

    const toolNode = new ToolNode<typeof GraphState.State>(tools);

    const model = new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0
    }).bindTools(tools);

    async function callModel(state: typeof GraphState.State) {
        const prompt = ChatPromptTemplate.fromMessages([['system', `${agentConfig.description} | Available tools: {tool_names}.`], new MessagesPlaceholder('messages')]);

        const formattedPrompt = await prompt.formatMessages({
            tool_names: tools.map((tool) => tool.name).join(', '),
            messages: state.messages
        });

        const result = await model.invoke(formattedPrompt);

        return { messages: [result] };
    }

    const workflow = new StateGraph(GraphState)
        .addNode('agent', callModel)
        .addNode('tools', toolNode)
        .addEdge('__start__', 'agent')
        .addConditionalEdges('agent', shouldContinue)
        .addEdge('tools', 'agent');

    function shouldContinue(state: typeof GraphState.State) {
        const messages = state.messages;
        const lastMessage = messages[messages.length - 1] as AIMessage;

        return lastMessage.tool_calls?.length ? 'tools' : '__end__';
    }

    const checkpointer = new MongoDBSaver({ client, dbName });

    const app = workflow.compile({ checkpointer });

    const finalState = await app.invoke(
        {
            messages: [new HumanMessage(query)]
        },
        { recursionLimit: 15, configurable: { thread_id: phone } }
    );

    const responseContent = finalState.messages[finalState.messages.length - 1].content;

    await conversationsCollection.updateOne({ phone, owner }, { $push: { messages: { role: 'assistant', content: responseContent, timestamp: new Date() } } });

    return responseContent;
}
