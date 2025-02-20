import { Request, Response } from 'express';
import { agentService } from '../services/agentService';

export const agentController = {
    async createAgent(req: Request, res: Response) {
        try {
            const agent = await agentService.createAgent(req.body);
            res.status(201).json(agent);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Error creating agent' });
        }
    },

    async updateAgent(req: Request, res: Response) {
        try {
            const agent = await agentService.updateAgent(req.params.id, req.body);
            res.json(agent);
        } catch (error) {
            res.status(500).json({ error: 'Error updating agent' });
        }
    },

    async getAgent(req: Request, res: Response) {
        try {
            const agent = await agentService.getAgentConfiguration(req.params.id);
            res.json(agent);
        } catch (error) {
            res.status(404).json({ error: 'Agent not found' });
        }
    },

    async getAgents(req: Request, res: Response) {
        try {
            if (!req.query.owner) {
                res.status(401).json({ error: 'Bad Request' });
            }
            const agents = await agentService.getAgents(req.query.owner);
            res.json(agents);
        } catch (error) {
            res.status(404).json({ error: 'Agent not found' });
        }
    },

    // Account
    async getAccount(req: Request, res: Response) {
        try {
            //@ts-ignore Property 'user' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'
            const account = await agentService.getAccount(req.user.email);
            res.json(account);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching account data' });
        }
    },

    async updateAccount(req: Request, res: Response) {
        try {
            //@ts-ignore Property 'user' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'
            const updatedAccount = await agentService.updateAccount(req.user.email, req.body);
            res.json(updatedAccount);
        } catch (error) {
            res.status(500).json({ error: 'Error updating account data' });
        }
    }
};