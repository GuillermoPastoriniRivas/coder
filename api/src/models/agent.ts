import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

interface IToolConfig {
    name: string;
    description?: string;
    enabled: boolean;
}

interface IKnowledgeItem {
    content: string;
    type: 'text' | 'file';
}

interface IAgent extends Document {
    publicId: string;
    name: string;
    owner: string;
    description: string;
    prompt: string;
    tools: IToolConfig[];
    knowledge: string;
    modelConfig: {
        provider: 'openai';
        model: string;
        temperature: number;
    };
}

const ToolConfigSchema = new Schema<IToolConfig>({
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true }
});

const KnowledgeItemSchema = new Schema<IKnowledgeItem>({
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'file'], required: true }
});

const AgentSchema = new Schema<IAgent>({
    name: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    description: { type: String, required: true },
    prompt: { type: String, required: true },
    tools: { type: [ToolConfigSchema], default: [] },
    knowledge: { type: String, required: true },
    modelConfig: {
        provider: { type: String, default: 'openai' },
        model: { type: String, default: 'gpt-4o-mini' },
        temperature: { type: Number, default: 0 }
    },
    publicId: { 
      type: String, 
      required: true, 
      unique: true,
      default: () => uuidv4()
    }
});

export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);