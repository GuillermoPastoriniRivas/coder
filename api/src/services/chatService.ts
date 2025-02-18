import { conversationRepository } from '../repositories/conversationRepository';
import { callAgent } from '../utils/langchain';

export const chatService = {
    async saveMessage(phone: string, message: string, agentId: string) {
        const conversation = {
            phone,
            agentId,
            messages: [{ role: 'user', content: message, timestamp: new Date() }]
        };
        await conversationRepository.upsertConversation(conversation);
    },

    async callAgent(message: string, phone: string, agentId: string) {
        return await callAgent(message, phone, agentId);
    },

    async callPublicAgent(message: string, phone: string, agentId: string) {
        return await callAgent(message, phone, agentId, true);
    }
};