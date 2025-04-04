import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export const syncController = {
    async sync(req: Request, res: Response) {
        try {
            //@ts-ignore
            const userId = req.user?.id;
            const folder = req.body.folder;
            const directoryTree = req.body.directoryTree;

            if (!userId || !folder || !directoryTree) {
                return res.status(200).json({ error: 'Datos incompletos' });
            }

            // Sanitizar nombres
            const safeUserId = userId.replace(/[\/\\]/g, '_');
            const safeFolder = folder.replace(/[\/\\]/g, '_');

            const baseDir = path.resolve(process.cwd(), 'sources', safeUserId, safeFolder);
            if (!baseDir.startsWith(process.cwd())) {
                return res.status(400).json({ error: 'Ruta inválida' });
            }

            await fs.mkdir(baseDir, { recursive: true });

            // 1. List files on the server
            const serverFiles = await listFilesRecursively(baseDir);
            const clientFiles = getAllFilePathsFromTree(directoryTree, baseDir);

            // 2 & 3. Identify deleted files
            const filesToDelete = serverFiles.filter(serverFile => !clientFiles.includes(serverFile));

            // 4. Delete files on server
            for (const fileToDelete of filesToDelete) {
                await fs.unlink(fileToDelete);
            }

            const processNode = async (node: any, currentPath: string) => {
                const nodeName = node.name.replace(/[\/\\]/g, '_'); // Sanitizar nombre
                const nodePath = path.join(currentPath, nodeName);

                if (node.children) {
                    await fs.mkdir(nodePath, { recursive: true });
                    for (const child of node.children) {
                        await processNode(child, nodePath);
                    }
                } else if (node.content !== undefined) {
                    await fs.writeFile(nodePath, node.content);
                }
            };

            for (const node of directoryTree) {
                await processNode(node, baseDir);
            }

            // Update vectors after sync is complete
            const config = path.resolve(process.cwd(), 'sources', safeUserId, `${safeFolder}.json`);
            const pythonProcess = spawn('python', ['src/scripts/call_documenter.py', '--project', baseDir, '--config', config]);
            console.log(`python src/scripts/call_documenter.py --project ${baseDir} --config ${config}`)
            await new Promise((resolve, reject) => {
                let output = '';
                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                pythonProcess.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                    reject(new Error(`Error in call_documenter.py: ${data}`));
                });
                pythonProcess.on('close', (code) => {
                    console.log(`call_documenter.py exited with code ${code}`);
                    if (code === 0) {
                        resolve(output.trim());
                    } else {
                        reject(new Error(`call_documenter.py exited with code ${code}`));
                    }
                });
            });


            res.json({ message: 'Estructura sincronizada y vectores actualizados exitosamente' });
        } catch (error) {
            console.error('Error en syncController:', error);
            res.status(500).json({ error: 'Error al sincronizar estructura' });
        }
    },

    // updateVectors endpoint is now deprecated and its logic is included in sync
    async updateVectors(req: Request, res: Response) {
        return res.status(410).json({ error: 'Endpoint deprecated. Use /sync instead.' });
    }
};


async function listFilesRecursively(dir: string): Promise<string[]> {
    let fileList: string[] = [];
    try {
        const items = await fs.readdir(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
                fileList = fileList.concat(await listFilesRecursively(itemPath));
            } else {
                fileList.push(itemPath);
            }
        }
    } catch (error) {
        console.error('Error listing directory:', error);
    }
    return fileList;
}


function getAllFilePathsFromTree(tree: any[], basePath: string): string[] {
    let files: string[] = [];
    for (const node of tree) {
        const nodePath = path.join(basePath, node.name);
        if (node.children) {
            files = files.concat(getAllFilePathsFromTree(node.children, nodePath));
        } else if (node.content !== undefined) {
            files.push(nodePath);
        }
    }
    return files;
}