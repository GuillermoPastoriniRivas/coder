import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseHistory extends Document {
    userId: Schema.Types.ObjectId;
    amount: number; // Amount in USD or credits, depending on your logic
    timestamp: Date;
    status: string; // e.g., 'Completed', 'Pending', 'Failed'
    paymentIntentId?: string; // Optional: Store Stripe Payment Intent ID
}

const PurchaseHistorySchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    status: { type: String, required: true, default: 'Completed' },
    paymentIntentId: { type: String, required: false },
});

export const PurchaseHistory = mongoose.model<IPurchaseHistory>('PurchaseHistory', PurchaseHistorySchema);