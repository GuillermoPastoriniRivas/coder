import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any) {
        const newConversation = new Conversation({
            userId: conversation.userId,
            messages: conversation.messages,
        });
        await newConversation.save();
    },

    async getConversations(userId: string) {
        return await Conversation.find({ userId });
    },

    async getConversation(conversationId: string) {
        return await Conversation.findOne({ _id: conversationId });
    }
};