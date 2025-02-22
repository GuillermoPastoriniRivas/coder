import { Request, Response } from 'express';
import { widgetService } from '../services/widgetService';

export const widgetController = {
  initializeWidget: async (req: Request, res: Response) => {
    const { agentId, phone } = req.body;
    try {
      const widgetData = await widgetService.initializeConversation(agentId, phone);
      res.status(200).json(widgetData);
    } catch (error) {
      console.error('Error initializing widget:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    const { agentId, phone, message } = req.body;
    try {
      const response = await widgetService.handleMessage(agentId, phone, message);
      res.status(200).json({ response });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getConversation: async (req: Request, res: Response) => {
    const { agentId, phone } = req.params;
    try {
      const conversation = await widgetService.getConversation(agentId, phone);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.status(200).json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};