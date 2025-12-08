import { MongoClient } from 'mongodb';
import 'dotenv/config';
import { conversationRepository } from '../repositories/conversationRepository';
import { spawn } from 'child_process';
import path from 'path';
import { User } from '../models/User';
import { promises as fs } from 'fs'; // Import fs.promises for file operations

export async function callAgent(
    query: string,
    userId: string,
    folder: string,
    subFolders: string[] | string,
    model: string,
    selectedFiles: string[],
    tokenLimit: number,
    existingConversationId?: string,
    previousAssistantResponse?: string | null,
    imagePath?: string | null, // New parameter for image path
    provider?: string | null // NEW: Add provider parameter
): Promise<{ response: string; conversationId?: string }> {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const safeUserId = userId.replace(/[\/\\]/g, '_');
    const safeFolder = folder.replace(/[\/\\]/g, '_');

    const userMessageForConversation = { role: 'user', content: query, timestamp: new Date() };

    let currentConversationId: string | undefined = existingConversationId;

    if (!currentConversationId || currentConversationId === 'undefined') {
        const newConversation = {
            userId,
            folder,
            aiModel: model,
            messages: [userMessageForConversation],
            userMessages: [userMessageForConversation],
        };
        currentConversationId = await conversationRepository.upsertConversation(newConversation, true);
        if (!currentConversationId) {
            throw new Error('Failed to create new conversation');
        }
    } else {
        await conversationRepository.upsertConversation(
            { userId, folder, messages: [userMessageForConversation] },
            false,
            currentConversationId
        );
    }

    const baseDir = path.resolve(process.cwd(), 'sources', safeUserId, safeFolder);

    const project = baseDir;
    const config = path.resolve(process.cwd(), 'sources', safeUserId, `${safeFolder}.json`);
    // console.log(`Executing Python script with project: ${project}, instruction: ${query}, config: ${config}`);

    let sanitizedResponseContent: string;
    let pythonScriptPath: string; // NEW: Declare pythonScriptPath

    // NEW: Determine which Python script to use based on model and provider
    if (model === 'coder') {
        const actualProvider = provider || 'gemini'; // Default to gemini if not specified
        pythonScriptPath = path.join('src/scripts', `code-dev-${actualProvider}.py`);
    } else if (model === 'qa') {
        pythonScriptPath = 'src/scripts/code-qa.py';
    } else {
        throw new Error(`Unsupported AI model: ${model}`);
    }

    const arrayOfSubFolders: string = typeof subFolders === 'string' ? subFolders : Array.isArray(subFolders) ? subFolders.join(',') : '';

    const pythonArgs: string[] = [
        pythonScriptPath, // This is the first argument to python executable
        '--instruction', query,
        '--project', project,
        '--config', config,
        '--model', model, // The original model ('coder' or 'qa')
        '--subfolders', arrayOfSubFolders,
        '--selectedFiles', (selectedFiles || []).join(','),
        '--userId', userId,
        '--tokenLimit', tokenLimit.toString()
    ];

    if (previousAssistantResponse) {
        pythonArgs.push('--previous-response', previousAssistantResponse);
    }

    // Pass image path to Python script if available
    if (imagePath) {
        // Resolve the absolute path to the image file on the server
        const absoluteImagePath = path.resolve(process.cwd(), 'sources', imagePath);
        pythonArgs.push('--imagePath', absoluteImagePath);
    }

    // Consolidated spawning logic
    const pythonProcess = spawn('python', pythonArgs);

    const responsePromise = new Promise((resolve, reject) => {
        let output = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr from ${pythonScriptPath}: ${data}`);
            reject(new Error(`Error in Python script (${pythonScriptPath}): ${data}`));
        });

        pythonProcess.on('close', (code) => {
            console.log(`${pythonScriptPath} exited with code ${code}`);
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`${pythonScriptPath} exited with code ${code}`));
            }
        });
    });

    const rawResponseContent = await responsePromise as string;

    sanitizedResponseContent = rawResponseContent;
    try {
        sanitizedResponseContent = sanitizedResponseContent
                .replace(/\\\n/g, '\n')
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"');

            sanitizedResponseContent = sanitizedResponseContent.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });

        sanitizedResponseContent = sanitizedResponseContent
            .replace(/\\\//g, '/')
            .replace(/\\\\/g, '\\');
    } catch (e) {
        console.error("Error sanitizing AI response content:", e);
    }


    const assistantMessageForConversation = { role: 'assistant', content: sanitizedResponseContent, timestamp: new Date() };

    await conversationRepository.upsertConversation(
        { userId, folder, messages: [assistantMessageForConversation] },
        false,
        currentConversationId
    );

    return { response: sanitizedResponseContent, conversationId: currentConversationId };
}