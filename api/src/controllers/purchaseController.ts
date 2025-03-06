import { Request, Response } from 'express';
import { User } from '../models/User';

export const purchaseController = {
    async purchaseTokens(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { tokens } = req.body;

            if (!tokens || tokens <= 0) {
                return res.status(400).json({ error: 'Invalid token amount' });
            }

            // Here, you should handle payment processing.
            // For simplicity, we'll assume payment is successful.

            // Update user's saldo
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.saldo += tokens;
            await user.save();

            res.json({ message: 'Tokens purchased successfully', saldo: user.saldo });
        } catch (error) {
            console.error('Error purchasing tokens:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};