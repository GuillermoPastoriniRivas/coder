import { PurchaseHistory } from '../models/PurchaseHistory';
import { Schema } from 'mongoose';

export const purchaseService = {
    async recordPurchase(userId: Schema.Types.ObjectId, amount: number, status: string = 'Completed', paymentIntentId?: string): Promise<void> {
        try {
            const historyEntry = new PurchaseHistory({
                userId,
                amount,
                status,
                paymentIntentId,
                timestamp: new Date(),
            });
            await historyEntry.save();
            console.log(`Purchase history recorded for user ${userId}, amount ${amount}`);
        } catch (error) {
            console.error('Error recording purchase history:', error);
            // Decide if this error should be propagated or just logged
            // throw new Error('Failed to record purchase history');
        }
    },

    async getPurchaseHistoryForUser(userId: Schema.Types.ObjectId) {
        try {
            // Find history and sort by newest first
            const history = await PurchaseHistory.find({ userId }).sort({ timestamp: -1 });
            return history;
        } catch (error) {
            console.error('Error fetching purchase history:', error);
            throw new Error('Failed to fetch purchase history');
        }
    }
};