import mongoose, { Document, Schema } from 'mongoose';

interface IMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface IConversation extends Document {
    userId: Schema.Types.ObjectId;
    folder: string;
    messages: IMessage[];
    userMessages: IMessage[]; // Nuevo atributo para mensajes del usuario
    title?: string; 
    aiModel?: string;
}

const messageSchema = new Schema<IMessage>({
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now }
});

const conversationSchema = new Schema<IConversation>({
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    messages: [messageSchema],
    userMessages: [messageSchema], // Definición del nuevo atributo en el esquema
    title: { type: String, required: false },
    folder: { type: String, required: true },
    aiModel: { type: String, required: false }
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);