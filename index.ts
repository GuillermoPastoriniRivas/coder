import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { callAgent } from './agent';

const app: Express = express();
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

async function startServer() {
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log('You successfully connected to MongoDB!');

        // GET http://localhost:3000/
        app.get('/', (req: Request, res: Response) => {
            res.send('Agent Server');
        });

        // POST http://localhost:3000/chat | Body: {"message": "Hello", "phone": "123123", "owner": "333333"}
        app.post('/chat', async (req: Request, res: Response) => {
            const { phone, message, owner } = req.body;
            try {
                const db = client.db('xenio');
                const conversationsCollection = db.collection('conversations');

                const conversation = {
                    phone,
                    owner,
                    messages: [{ role: 'user', content: message, timestamp: new Date() }]
                };

                await conversationsCollection.updateOne({ phone, owner }, { $set: conversation }, { upsert: true });
                res.status(200).json({ message: 'Message received' });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // POST http://localhost:3000/chat | Body: {"message": "Hello", "phone": "123123", "owner": "333333"}
        app.post('/call', async (req: Request, res: Response) => {
            const { phone, message, owner } = req.body;
            try {
                const response = await callAgent(client, message, phone, owner);
                res.json({ response });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // GET http://localhost:3000/agents/:id
        app.get('/agents/:name', async (req: Request, res: Response) => {
            const { name } = req.params;

            try {
                const db = client.db('xenio');
                const result = await db.collection('agentConfigs').findOne({ name: name });

                if (!result) {
                    return res.status(404).json({ error: 'Agent not found' });
                }

                res.json({ result });
            } catch (error) {
                console.error('Error updating agent:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // POST http://localhost:3000/agents | Body: {"owner": "owner1", "description": "Agent description"}
        app.post('/agents', async (req: Request, res: Response) => {
            const { owner, description } = req.body;

            try {
                const db = client.db('xenio');
                const result = await db.collection('agentConfigs').insertOne({ owner, description });
                res.status(201).json({ message: 'Agent created', agentId: result.insertedId });
            } catch (error) {
                console.error('Error creating agent:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // POST http://localhost:3000/agents/:id | Body: {"description": "Updated description"}
        app.post('/agents/:name', async (req: Request, res: Response) => {
            const { name } = req.params;
            const { description } = req.body;

            try {
                const db = client.db('xenio');
                const result = await db.collection('agentConfigs').updateOne({ name: name }, { $set: { description } });

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Agent not found' });
                }

                res.json({ message: 'Agent updated' });
            } catch (error) {
                console.error('Error updating agent:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

startServer();
