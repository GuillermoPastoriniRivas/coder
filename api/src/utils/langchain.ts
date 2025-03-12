import { MongoClient } from 'mongodb';
import 'dotenv/config';
import { conversationRepository } from '../repositories/conversationRepository';
import { spawn } from 'child_process';
import path from 'path';
import { User } from '../models/User'; 

export async function callAgent(query: string, userId: string, folder: string, subFolders: string[], model: string, selectedFiles: string[]) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Check if user has sufficient saldo
    if (user.saldo < 1) {
        throw new Error('Insufficient saldo. Please purchase more tokens.');
    }

    // Deduct 1 saldo
    user.saldo -= 1;
    await user.save();

    const safeUserId = userId.replace(/[\/\\]/g, '_');
    const safeFolder = folder.replace(/[\/\\]/g, '_');

    const conversation = {
        userId,
        folder,
        model,
        messages: [{ role: 'user', content: query, timestamp: new Date() }]
    };

    await conversationRepository.upsertConversation(conversation, true); 

    const baseDir = path.resolve(process.cwd(), 'sources', safeUserId, safeFolder);

    const project = baseDir;
    const config = path.resolve(process.cwd(), 'sources', safeUserId, `${safeFolder}.json`);
    console.log(`Executing Python script with project: ${project}, instruction: ${query}, config: ${config}`);

    const pythonProcess = spawn('python', [
        'src/scripts/code-dev.py',
        '--instruction', query,
        '--project', project,
        '--config', config,
        '--model', model,
        '--subfolders', (subFolders || []).join(','),
        '--selectedFiles', (selectedFiles || []).join(',')
    ]);
    const responsePromise = new Promise((resolve, reject) => {
        let output = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject(new Error(`Error in code-dev.py: ${data}`));
        });

        pythonProcess.on('close', (code) => {
            console.log(`code-dev.py exited with code ${code}`);
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`code-dev.py exited with code ${code}`));
            }
        });
    });

    const responseContent = await responsePromise;

    const response = {
        userId,
        folder,
        model,
        messages: [{ role: 'assistant', content: responseContent, timestamp: new Date() }]
    };
    await conversationRepository.upsertConversation(response);

    return responseContent;
}
