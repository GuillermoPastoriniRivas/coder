import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenUsage extends Document {
    userId: Schema.Types.ObjectId;
    project_name: string;
    aiModel: string;
    input_tokens: number;
    output_tokens: number;
    input_cost: number;
    output_cost: number;
    total_cost: number;
    delay: number;
    timestamp: Date;
}

const TokenUsageSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project_name: { type: String, required: false }, // Allow project name to be optional if needed
    aiModel: { type: String, required: true },
    input_tokens: { type: Number, required: true },
    output_tokens: { type: Number, required: true },
    input_cost: { type: Number, required: true },
    output_cost: { type: Number, required: true },
    total_cost: { type: Number, required: true },
    delay: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, required: true },
});

// Add index on userId and timestamp for faster querying
TokenUsageSchema.index({ userId: 1, timestamp: -1 });

export const TokenUsage = mongoose.model<ITokenUsage>('TokenUsage', TokenUsageSchema, 'tokensUsage'); // Explicitly specify collection name