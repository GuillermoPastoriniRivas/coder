import { conversationRepository } from '../repositories/conversationRepository';
import { callAgent } from '../utils/langchain';

export const chatService = {
    async saveMessage( message: string, userId: string) {
        const conversation = {
            userId,
            messages: [{ role: 'user', content: message, timestamp: new Date() }]
        };
        await conversationRepository.upsertConversation(conversation);
    },

    async callAgent(message: string, user: string) {
        return await callAgent(message, user);
    }
};