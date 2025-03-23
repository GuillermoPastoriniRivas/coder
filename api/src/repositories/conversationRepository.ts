import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any, isUserMessage: boolean = false, conversationId?: string | undefined): Promise<string | undefined> {
        const { userId, folder, model } = conversation;

        if (isUserMessage) {
            const updatedConversation = await Conversation.findOneAndUpdate(
                { userId, folder },
                { $set: { userMessages: conversation.messages, aiModel: model } },
                { upsert: true, new: true }
            );
            return updatedConversation?._id?.toString();
        }   

        if (conversationId) {
            await Conversation.findOneAndUpdate(
                { _id: conversationId },
                { $set: { messages: conversation.messages } }
            );
            return conversationId?.toString();
        }

        const newConversation = new Conversation({
            userId: conversation.userId,
            folder: conversation.folder,
            messages: conversation.messages,
        });

        const savedConversation = await newConversation.save(); 
        return savedConversation?._id?.toString();
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