import { Request, Response } from 'express';
import { agentService } from '../services/agentService';

export const agentController = {
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