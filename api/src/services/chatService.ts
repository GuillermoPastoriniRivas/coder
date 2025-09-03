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

    async callAgent(
        message: string,
        userId: string,
        folder: string,
        subFolders: string[],
        model: string,
        selectedFiles: string[],
        tokenLimit: number,
        existingConversationId?: string,
        previousAssistantResponse?: string | null
    ): Promise<{ response: string; conversationId?: string }> {
        return await callAgent(
            message,
            userId,
            folder,
            subFolders,
            model,
            selectedFiles,
            tokenLimit,
            existingConversationId,
            previousAssistantResponse
        );
    }
};