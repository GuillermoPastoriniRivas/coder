import { Request, Response } from 'express';
import { User } from '../models/User';
import { TokenUsage } from '../models/TokenUsage'; // Import the TokenUsage model
import { Schema } from 'mongoose';

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
    },

    // New function to get call history
    async getCallHistory(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.id;

            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            // Fetch call history for the user, sorted by newest first
            const history = await TokenUsage.find({ userId: userId as Schema.Types.ObjectId })
                                            .sort({ timestamp: -1 }); // Sort by timestamp descending

            res.json(history);
        } catch (error) {
            console.error('Error fetching call history:', error);
            res.status(500).json({ error: 'Internal server error fetching call history' });
        }
    }
};