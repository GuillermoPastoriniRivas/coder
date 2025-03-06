import { Request, Response } from 'express';
import { User } from '../models/User';

export const userController = {
    async getSaldo(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ saldo: user.saldo });
        } catch (error) {
            console.error('Error fetching saldo:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};