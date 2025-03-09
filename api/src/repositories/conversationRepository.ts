import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any) {
        const newConversation = new Conversation({
            userId: conversation.userId,
            folder: conversation.folder,
            messages: conversation.messages,
        });
        await newConversation.save();
    },

    async getConversations(userId: string, folder: string) {
        return await Conversation.find({ userId, folder }).sort({_id: -1});
    },

    async deleteConversation(conversationId: string) {
        await Conversation.deleteOne({ _id: conversationId });
    },

    async getConversation(conversationId: string) {
        return await Conversation.findOne({ _id: conversationId });
    }
};