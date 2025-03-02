import { Request, Response } from 'express';
import { chatService } from '../services/chatService';
import { conversationRepository } from '../repositories/conversationRepository';

export const postChat = async (req: Request, res: Response) => {
    const { phone, message, owner } = req.body;
    try {
        await chatService.saveMessage(phone, message, owner);
        res.status(200).json({ message: 'Message received' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const postCall = async (req: Request, res: Response) => {
    const { message } = req.body;
    try {
        const response = await chatService.callAgent(message);
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