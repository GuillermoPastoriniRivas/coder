import { Request, Response } from 'express';
import { User } from '../models/User';
import { purchaseService } from '../services/purchaseService'; // Import the service
import { Schema } from 'mongoose';

export const purchaseController = {
    async purchaseTokens(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.id;
            const { tokens } = req.body;
            const usdAmount = req.body.amount; // Get USD amount from request
            const paymentIntentId = req.body.paymentIntentId; // Optional: Get paymentIntentId if passed

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

            // --- Record Purchase History ---
            // Use usdAmount if available, otherwise creditsToAdd (if it came from 'tokens')
            const amountRecorded = usdAmount ? parseFloat(usdAmount) : creditsToAdd;
             try {
                 await purchaseService.recordPurchase(
                     user._id as Schema.Types.ObjectId,
                     amountRecorded,
                     'Completed',
                     paymentIntentId // Pass if available
                 );
             } catch (historyError) {
                 // Log the error but don't fail the entire request, as the credits were added.
                 // Consider more robust error handling/queueing for production.
                 console.error("Failed to record purchase history after successful credit update:", historyError);
             }
            // --- End Record Purchase History ---


            res.json({ message: 'Credits added successfully', saldo: user.saldo });
        } catch (error) {
            console.error('Error purchasing tokens/credits:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // --- New Controller Method for Fetching History ---
    async getPurchaseHistory(req: Request, res: Response) {
        try {
            // @ts-ignore
            const userId = req.user.id;

            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const history = await purchaseService.getPurchaseHistoryForUser(userId as Schema.Types.ObjectId);
            res.json(history);
        } catch (error) {
             console.error('Error fetching purchase history:', error);
             // Check if it's a known error type or just return a generic message
             if (error instanceof Error) {
                 res.status(500).json({ error: error.message });
             } else {
                 res.status(500).json({ error: 'Internal server error fetching purchase history' });
             }
        }
    }
    // --- End New Controller Method ---
};