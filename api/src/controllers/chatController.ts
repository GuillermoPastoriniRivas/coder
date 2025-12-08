import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { conversationRepository } from '../repositories/conversationRepository';
import path from 'path';
import { promises as fs } from 'fs';

export const postCall = async (req: Request, res: Response) => {
    const { message, folder, subFolders, model, selectedFiles, tokenLimit, conversationId, provider } = req.body;
    try {
        //@ts-ignore
        const userId = req.user.id;

        let previousAssistantResponse: string | null = null;
        if (conversationId && conversationId !== 'undefined') {
            const conversation = await conversationRepository.getConversation(conversationId);
            if (conversation) {
                const lastAssistantMessage = conversation.messages
                                                 .filter(msg => msg.role === 'assistant')
                                                 .pop();
                if (lastAssistantMessage) {
                    previousAssistantResponse = lastAssistantMessage.content;
                }
            }
        }

        let imagePath: string | null = null;
        //@ts-ignore
        if (req.file) {
            //@ts-ignore
            const uploadedFile = req.file;
            const safeUserId = userId.replace(/[/\\]/g, '_');
            const safeFolder = folder.replace(/[/\\]/g, '_');
            const attachmentDir = path.join(process.cwd(), 'sources', safeUserId, safeFolder, 'attachments');
            await fs.mkdir(attachmentDir, { recursive: true });

            const newFilePath = path.join(attachmentDir, uploadedFile.filename);
            await fs.rename(uploadedFile.path, newFilePath); // Move the file from temp to permanent location

            // Store relative path from 'sources' directory for DB and UI access
            imagePath = path.join(safeUserId, safeFolder, 'attachments', uploadedFile.filename).replace(/\\/g, '/');
        }

        const { response: aiResponse, conversationId: updatedConversationId } = await chatService.callAgent(
            message,
            userId,
            folder,
            subFolders,
            model,
            selectedFiles,
            tokenLimit,
            conversationId,
            previousAssistantResponse,
            imagePath, // Pass the image path to chatService
            provider
        );
        res.json({ response: aiResponse, conversationId: updatedConversationId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getConversation = async (req: Request, res: Response) => {
    const { conversationId } = req.body;
    try {
        //@ts-ignore
        const conversation = await conversationRepository.getConversation(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getConversations = async (req: Request, res: Response) => {
    try {
        //@ts-ignore
        const userId = req.user.id;
        const { folder } = req.params;
        const conversations = await conversationRepository.getConversations(userId, folder);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching conversations' });
    }
};

export const updateConversationTitle = async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { title } = req.body;

    try {
        const conversation = await conversationRepository.getConversation(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        conversation.title = title;
        await conversation.save();

        res.json({ message: 'Title updated successfully' });
    } catch (error) {
        console.error('Error updating conversation title:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteConversation = async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    try {
        const conversation = await conversationRepository.getConversation(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        await conversationRepository.deleteConversation(conversationId);
        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};