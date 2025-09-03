import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { conversationRepository } from '../repositories/conversationRepository';

export const postCall = async (req: Request, res: Response) => {
    const { message, folder, subFolders, model, selectedFiles, tokenLimit, conversationId } = req.body;
    try {
        //@ts-ignore
        const userId = req.user.id;

        let previousAssistantResponse: string | null = null;
        if (conversationId) {
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

        const { response: aiResponse, conversationId: updatedConversationId } = await chatService.callAgent(
            message,
            userId,
            folder,
            subFolders,
            model,
            selectedFiles,
            tokenLimit,
            conversationId,
            previousAssistantResponse
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