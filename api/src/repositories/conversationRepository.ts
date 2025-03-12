import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any, isUserMessage: boolean = false) {
        const { userId, folder, model } = conversation;

        if (isUserMessage) {
            // await Conversation.findOneAndUpdate(
            //     { userId, folder },
            //     { $set: { aiModel: model } }
            // );
            // await Conversation.findOneAndUpdate(
            //     { userId, folder },
            //     { $set: { userMessages: conversation.messages[0] } },
            //     { upsert: true, new: true }
            // );
            return;
        }   

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