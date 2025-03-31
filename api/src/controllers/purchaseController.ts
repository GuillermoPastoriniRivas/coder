import { Request, Response } from 'express';
import { User } from '../models/User';

export const purchaseController = {
    async purchaseTokens(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { tokens } = req.body;
            const usdAmount = req.body.amount; // Get USD amount from request

            let creditsToAdd = 0;

            if (usdAmount) {
                // If USD amount is provided, calculate credits based on USD amount (e.g., 1 USD = 1 credit)
                creditsToAdd = parseFloat(usdAmount); // Assuming 1 USD = 1 credit for now. Adapt logic as needed.
                if (creditsToAdd <= 0) {
                    return res.status(400).json({ error: 'Invalid purchase amount' });
                }
            } else if (tokens) {
                // If tokens are directly provided (e.g., for admin or specific scenarios), use that value
                if (!tokens || tokens <= 0) {
                    return res.status(400).json({ error: 'Invalid token amount' });
                }
                creditsToAdd = parseInt(tokens, 10);
            } else {
                return res.status(400).json({ error: 'Amount or tokens must be specified' });
            }


            // Update user's saldo
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.saldo += creditsToAdd;
            await user.save();

            res.json({ message: 'Credits added successfully', saldo: user.saldo });
        } catch (error) {
            console.error('Error purchasing tokens/credits:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};