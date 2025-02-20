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
app.post('/chat', authMiddleware, postChat);
app.post('/call', authMiddleware, postCall);

app.post('/agents', authMiddleware, agentController.createAgent);
app.put('/agents/:id', authMiddleware, agentController.updateAgent);
app.get('/agents/:id', authMiddleware, agentController.getAgent);
app.get('/agents', authMiddleware, agentController.getAgents);

app.get('/public/:publicId', publicController.getPublicAgent);

app.get('/conversations/:agentId/:phone', authMiddleware, getConversation);

app.get('/account', authMiddleware, agentController.getAccount);
app.put('/account', authMiddleware, agentController.updateAccount);

const PORT = process.env.PORT || 5000;                                                  
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

connectToMongoDB();