import { Agenda } from '@hokify/agenda';
import { MongoClient } from 'mongodb';
import { callAgent } from './agent';

const mongoConnectionString = process.env.MONGODB_ATLAS_URI as string;
const agenda = new Agenda({ db: { address: mongoConnectionString } });

interface Conversation {
    phone: string;
    owner: string;
    messages: Message[];
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

agenda.define('process conversations', async (job: any) => {
    const client = new MongoClient(mongoConnectionString);
    await client.connect();
    const db = client.db("xenio");
    const conversationsCollection = db.collection<Conversation>('conversations');

    const conversations = await conversationsCollection.find({}).toArray();

    for (const conversation of conversations) {
        const { phone, owner, messages } = conversation;
        const lastMessage = messages[messages.length - 1];
        const lastMessageTime = new Date(lastMessage.timestamp);
        const now = new Date();
        const timeDifference = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60); // in hours

        if (timeDifference >= 20) {
            const response = await callAgent(client, lastMessage.content, phone, owner);
            await conversationsCollection.updateOne(
                { phone, owner },
                { $push: { messages: { role: 'assistant', content: response, timestamp: new Date() } } }
            );
        }
    }

    await client.close();
});

(async function() {
    await agenda.start();
    await agenda.every('3 minutes', 'process conversations');
})();