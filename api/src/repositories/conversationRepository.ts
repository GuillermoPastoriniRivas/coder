import { Conversation } from '../models/conversation';

export const conversationRepository = {
    async upsertConversation(conversation: any) {
        await Conversation.findOneAndUpdate(
            { phone: conversation.phone, agentId: conversation.agentId },
            { $push: { messages: { $each: conversation.messages } } },
            { upsert: true, new: true }
        );
    },

    async getConversations() {
        return await Conversation.find({});
    }
};
