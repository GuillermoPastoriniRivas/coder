import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any, isUserMessage: boolean = false) {
        const { userId, folder, model } = conversation;
        const updateData = isUserMessage
            ? { $push: { userMessages: conversation.messages[0] } }
            : { $push: { messages: { $each: conversation.messages } } };

        await Conversation.findOneAndUpdate(
            { userId, folder },
            { $set: { aiModel: model } }
        );
        
        await Conversation.findOneAndUpdate(
            { userId, folder },
            updateData,
            { upsert: true, new: true }
        );
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