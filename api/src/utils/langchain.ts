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
import { conversationRepository } from '../repositories/conversationRepository';
import { agentService } from '../services/agentService';
import { spawn } from 'child_process';

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

const getAvailableSlotsTool = tool(
    async () => {
        // const response = await axios.get("https://api.example.com/get-available-slots");
        // return response.data;
        console.log('Fetch Available Slots');
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
        console.log(`Confirming appointment for slot: ${slot}`);
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
        console.log('Appointment saved successfully', slot);
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

const executePythonScriptTool = tool(
    async ({ instruction, project, config }: { instruction: string; project: string; config: string }) => {
        console.log(`Executing Python script with project: ${project}, instruction: ${instruction}, config: ${config}`);

        const pythonProcess = spawn('python', ['scripts/documenter.py', '--instruction', instruction, '--project', project, '--config', config]);

        return new Promise((resolve, reject) => {
            let output = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
                reject(new Error(`Error in documenter.py: ${data}`));
            });

            pythonProcess.on('close', (code) => {
                console.log(`documenter.py exited with code ${code}`);
                if (code === 0) {
                    resolve(output.trim()); // Devuelve la salida del script como resultado
                } else {
                    reject(new Error(`documenter.py exited with code ${code}`));
                }
            });
        });
    },
    {
        name: 'get_code_description',
        description: 'Executes a Python script to generate documentation using AI',
        schema: z.object({
            instruction: z.string().describe('The user instruction for generating documentation'),
            project: z.string().describe('The project path to analyze'),
            config: z.string().describe('The JSON configuration file path')
        })
    }
);

const toolsRegistry: Record<string, any> = {
    get_available_slots: getAvailableSlotsTool,
    confirm_date: confirmDateTool,
    set_appointment: setAppointmentTool,
    code_answer: executePythonScriptTool
};

export async function callAgent(query: string, phone: string, agentId: string, isPublic = false) {
    const agentConfig = isPublic ? await agentService.getAgentPublicConfiguration(agentId) : await agentService.getAgentConfiguration(agentId);

    const fullContext = `${agentConfig.prompt}\nKnowledge Base:\n${agentConfig.knowledge}`;

    const enabledTools = agentConfig.tools.map((t) => toolsRegistry[t.name]).filter((t) => t);

    const conversation = {
        phone,
        agentId,
        messages: [{ role: 'user', content: query, timestamp: new Date() }]
    };

    await conversationRepository.upsertConversation(conversation);

    const GraphState = Annotation.Root({
        messages: Annotation<BaseMessage[]>({
            reducer: (x, y) => x.concat(y)
        })
    });

    const toolNode = new ToolNode<typeof GraphState.State>(enabledTools);

    const model = new ChatOpenAI({
        model: agentConfig?.modelConfig?.model || 'gpt-4o-mini',
        temperature: agentConfig?.modelConfig?.temperature || 0
    }).bindTools(enabledTools);

    async function callModel(state: typeof GraphState.State) {
        const prompt = ChatPromptTemplate.fromMessages([['system', `${fullContext} | Available tools: {tool_names}.`], new MessagesPlaceholder('messages')]);

        const formattedPrompt = await prompt.formatMessages({
            tool_names: enabledTools.map((tool) => tool.name).join(', '),
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

    const checkpointer = new MongoDBSaver({ client, dbName: 'xenio' });

    const app = workflow.compile({ checkpointer });

    const finalState = await app.invoke(
        {
            messages: [new HumanMessage(query)]
        },
        { recursionLimit: 15, configurable: { thread_id: phone } }
    );

    const responseContent = finalState.messages[finalState.messages.length - 1].content;

    const response = {
        phone,
        agentId,
        messages: [{ role: 'assistant', content: responseContent, timestamp: new Date() }]
    };
    await conversationRepository.upsertConversation(response);

    return responseContent;
}
