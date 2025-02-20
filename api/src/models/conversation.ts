import mongoose, { Document, Schema } from 'mongoose';

interface IMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface IConversation extends Document {
    phone: string;
    agentId: Schema.Types.ObjectId;
    messages: IMessage[];
    callback?: string;
}

const messageSchema = new Schema<IMessage>({
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now }
});

const conversationSchema = new Schema<IConversation>({
    phone: { type: String, required: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    messages: [messageSchema],
    callback: { type: String, required: false },
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);