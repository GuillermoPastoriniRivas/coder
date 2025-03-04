import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export const syncController = {
    async sync(req: Request, res: Response) {
        try {
            // Validar datos del request
            //@ts-ignore
            const userId = req.user?.id;
            const folder = req.body.folder;
            const directoryTree = req.body.directoryTree;

            if (!userId || !folder || !directoryTree) {
                return res.status(400).json({ error: 'Datos incompletos' });
            }

            // Sanitizar nombres
            const safeUserId = userId.replace(/[\/\\]/g, '_');
            const safeFolder = folder.replace(/[\/\\]/g, '_');

            // Crear ruta base
            const baseDir = path.resolve(
                process.cwd(),
                'sources',
                safeUserId,
                safeFolder
            );

            // Validar seguridad de rutas
            if (!baseDir.startsWith(process.cwd())) {
                return res.status(400).json({ error: 'Ruta inválida' });
            }

            // Crear directorio base
            await fs.mkdir(baseDir, { recursive: true });

            // Función recursiva para crear estructura
            const processNode = async (node: any, currentPath: string) => {
                const nodeName = node.name.replace(/[\/\\]/g, '_'); // Sanitizar nombre
                const nodePath = path.join(currentPath, nodeName);

                if (node.children) {
                    // Es directorio
                    await fs.mkdir(nodePath, { recursive: true });
                    for (const child of node.children) {
                        await processNode(child, nodePath);
                    }
                } else if (node.content !== undefined) {
                    // Es archivo
                    await fs.writeFile(nodePath, node.content);
                }
            };

            // Procesar cada nodo raíz
            for (const node of directoryTree) {
                await processNode(node, baseDir);
            }

            res.json({ message: 'Estructura creada exitosamente' });
        } catch (error) {
            console.error('Error en syncController:', error);
            res.status(500).json({ error: 'Error al sincronizar estructura' });
        }
    }
};