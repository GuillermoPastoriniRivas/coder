import mongoose, { Document, Schema } from 'mongoose';

interface IMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    imagePath?: string; // Nuevo atributo para la ruta de la imagen adjunta
}

interface IConversation extends Document {
    userId: Schema.Types.ObjectId;
    folder: string;
    messages: IMessage[];
    userMessages: IMessage[];
    title?: string;
    aiModel?: string;
    created_at?: Date;
}

const messageSchema = new Schema<IMessage>({
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    imagePath: { type: String, required: false } // Definición del nuevo atributo en el esquema
});

const conversationSchema = new Schema<IConversation>({
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    messages: [messageSchema],
    userMessages: [messageSchema],
    title: { type: String, required: false },
    folder: { type: String, required: true },
    aiModel: { type: String, required: false },
    created_at: { type: Date, required: true, default: Date.now }
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);