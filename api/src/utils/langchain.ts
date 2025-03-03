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
import 'dotenv/config';
import { conversationRepository } from '../repositories/conversationRepository';
import { spawn } from 'child_process';

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

const executePythonScriptTool = tool(
    async ({ instruction, project, config }: { instruction: string; project: string; config: string }) => {
        console.log(`Executing Python script with project: ${project}, instruction: ${instruction}, config: ${config}`);

        const pythonProcess = spawn('python', ['scripts/codeanswer.py', '--instruction', instruction, '--project', project, '--config', config]);

        return new Promise((resolve, reject) => {
            let output = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
                reject(new Error(`Error in codeanswer.py: ${data}`));
            });

            pythonProcess.on('close', (code) => {
                console.log(`codeanswer.py exited with code ${code}`);
                if (code === 0) {
                    resolve(output.trim()); 
                } else {
                    reject(new Error(`codeanswer.py exited with code ${code}`));
                }
            });
        });
    },
    {
        name: 'extract_code_information',
        description: `Analyzes the code structure, extracts relevant information, and provides context-aware documentation based on user instructions. 
        It uses embeddings and cross-encoders to retrieve the most relevant code snippets and generates precise responses using a LLM.`,
        schema: z.object({
            instruction: z.string().describe('The user instruction for generating documentation'),
            project: z.string().describe('The project path to analyze'),
            config: z.string().describe('The JSON configuration file path')
        })
    }
);

const toolsRegistry: Record<string, any> = {
    extract_code_information: executePythonScriptTool
};

export async function callAgent(query: string, userId: string) {
    const agentConfig = {
        prompt: `You are an Agent specialized in generating and improving documentation for codebases. You can analyze thr code, extract relevant information, and provide context-aware documentation based on user instructions. You have advanced AI techniques, including embeddings and cross-encoders, to ensure the documentation is accurate and relevant.`,
        knowledge: 'I am a virtual assistant that can help you with a variety of tasks.',
        tools: ['extract_code_information'],
    }

    const fullContext = `${agentConfig.prompt}\nKnowledge Base:\n${agentConfig.knowledge}`;

    const enabledTools = agentConfig.tools.map((t) => toolsRegistry[t]).filter((t) => t);

    const conversation = {
        userId,
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
        model: 'gpt-4o-mini',
        temperature: 0.3
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

    const checkpointer = new MongoDBSaver({ client, dbName: 'coder' });

    const app = workflow.compile({ checkpointer });

    const finalState = await app.invoke(
        {
            messages: [new HumanMessage(query)]
        },
        { recursionLimit: 15, configurable: { thread_id: userId } }
    );

    const responseContent = finalState.messages[finalState.messages.length - 1].content;

    const response = {
        userId,
        messages: [{ role: 'assistant', content: responseContent, timestamp: new Date() }]
    };
    await conversationRepository.upsertConversation(response);

    return responseContent;
}
