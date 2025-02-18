import { Request, Response } from 'express';
import { chatService } from '../services/chatService';

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
    const { phone, message, agentId } = req.body;
    try {
        const response = await chatService.callAgent(message, phone, agentId);
        res.json({ response });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};