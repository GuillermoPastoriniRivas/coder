import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any) {
        await Conversation.findOneAndUpdate(
            { userId: conversation.userId },
            { $push: { messages: { $each: conversation.messages } } },
            { upsert: true, new: true }
        );
    },

    async getConversations() {
        return await Conversation.find({});
    },

    async getConversation(userId: string) {
        return await Conversation.findOne({ userId });
    }
};