import { Request, Response } from 'express';
import { Agent } from '../models/agent';

export const publicController = {
  getPublicAgent: async (req: Request, res: Response) => {
    try {
      const { publicId } = req.params;

      const agent = await Agent.findOne({ publicId })
        .select('-owner -modelConfig.apiKey -__v')
        .lean();

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const publicAgent = {
        ...agent,
        tools: agent.tools.filter(t => t.enabled).map(t => t.name)
      };

      res.json(publicAgent);
    } catch (error) {
      console.error('Error fetching public agent:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};