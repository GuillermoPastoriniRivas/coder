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

    const safeUserId = userId.replace(/[\/\\]/g, '_');
    const safeFolder = folder.replace(/[\/\\]/g, '_');

    const conversation = {
        userId,
        folder,
        model,
        messages: [{ role: 'user', content: query, timestamp: new Date() }]
    };

    const conversationId = await conversationRepository.upsertConversation(conversation, true);

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
        '--selectedFiles', (selectedFiles || []).join(','),
        '--userId', userId
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

    const rawResponseContent = await responsePromise as string;

    // Sanitize the response content
    let sanitizedResponseContent = rawResponseContent;
    try {
        // Paso 1: Manejar líneas que terminan con \
        // Reemplazar \\\n (que representa una barra invertida seguida de un salto de línea)
        sanitizedResponseContent = sanitizedResponseContent.replace(/\\\\\n/g, '\\\n');

        // Paso 2: Reemplazar newlines y comillas escapadas
        sanitizedResponseContent = sanitizedResponseContent
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"');

        // Paso 3: Decodificar secuencias Unicode
        sanitizedResponseContent = sanitizedResponseContent.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });

        // Paso 4: Corregir escape en expresiones regulares (como \/ o \\)
        // Esto revierte el escape excesivo en patrones como [\/\\] -> [\/\\]
        sanitizedResponseContent = sanitizedResponseContent
            .replace(/\\\//g, '/')  // Reemplazar \/ por /
            .replace(/\\\\/g, '\\'); // Reemplazar \\ por \
    } catch (e) {
        console.error("Error sanitizing AI response content:", e);
    }


    const response = {
        userId,
        folder,
        model,
        messages: [{ role: 'assistant', content: sanitizedResponseContent, timestamp: new Date() }]
    };
    await conversationRepository.upsertConversation(response, false, conversationId);

    return sanitizedResponseContent;
}