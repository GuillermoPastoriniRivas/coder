import { Agenda } from '@hokify/agenda';
import { conversationRepository } from './src/repositories/conversationRepository';
import { callAgent } from './src/utils/langchain';

const agenda = new Agenda({ db: { address: process.env.MONGODB_ATLAS_URI as string } });

agenda.define('process conversations', async (job: any) => {
    const conversations = await conversationRepository.getConversations();

    for (const conversation of conversations) {
        const { phone, agentId, messages } = conversation;
        const lastMessage = messages[messages.length - 1];
        const lastMessageTime = new Date(lastMessage.timestamp);
        const now = new Date();
        const timeDifference = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60); // in minutes

        if (timeDifference >= 3) { // 3 minutes
            const response = await callAgent(lastMessage.content, phone, agentId?.toString());
            await conversationRepository.upsertConversation({
                phone,
                agentId,
                messages: [...messages, { role: 'assistant', content: response, timestamp: new Date() }]
            });
        }
    }
});

(async function() {
    await agenda.start();
    await agenda.every('3 minutes', 'process conversations');
})();