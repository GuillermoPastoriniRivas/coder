import express, { Express, Request, Response } from 'express';
import { connectToMongoDB } from './src/config/mongoose';
import { postChat, postCall, getConversation } from './src/controllers/chatController';
import { agentController } from './src/controllers/agentController';
import cors from 'cors';
import { publicController } from './src/controllers/publicController';
import { authController } from './src/controllers/authController';
import { authMiddleware } from './src/middleware/authMiddleware';

const app: Express = express();
app.use(express.json());

app.use(cors());

app.get('/', (req: Request, res: Response) => {
    res.send('Agent Server');
});

// Authentication Routes
app.post('/auth/login', authController.login);

// Protected Routes
app.post('/chat', postChat);
app.post('/call', postCall);

app.post('/agents', agentController.createAgent);
app.put('/agents/:id', agentController.updateAgent);
app.get('/agents/:id', agentController.getAgent);
app.get('/agents', agentController.getAgents);

app.get('/public/:publicId', publicController.getPublicAgent);

app.get('/conversations/:agentId/:phone', getConversation);

app.get('/account', agentController.getAccount);
app.put('/account', agentController.updateAccount);

const PORT = process.env.PORT || 5000;                                                  
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

connectToMongoDB();