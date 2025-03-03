import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { conversationRepository } from '../repositories/conversationRepository';

export const postCall = async (req: Request, res: Response) => {
    const { message } = req.body;
    //@ts-ignore
    console.log(req.user)
    try {
        //@ts-ignore
        const response = await chatService.callAgent(message, req.user.id);
        res.json({ response });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getConversation = async (req: Request, res: Response) => {
    const { agentId, phone } = req.params;
    try {
        const conversation = await conversationRepository.getConversation(agentId, phone);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};