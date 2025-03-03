import express, { Express, Request, Response } from 'express';
import { connectToMongoDB } from './src/config/mongoose';
import { postCall, getConversation } from './src/controllers/chatController';
import { accountController } from './src/controllers/accountController';
import cors from 'cors';
import { authMiddleware } from './src/middleware/authMiddleware';
import { authController } from './src/controllers/authController';
const app: Express = express();
app.use(express.json());

app.use(cors());

app.get('/', (req: Request, res: Response) => {
    res.send('Agent Server');
});

app.post('/signup', authController.signUp);
app.post('/login', authController.login);

// Protected Routes
app.post('/call', authMiddleware, postCall);

app.get('/conversations', authMiddleware, getConversation);

app.get('/account', authMiddleware, accountController.getAccount);
app.put('/account', authMiddleware, accountController.updateAccount);

const PORT = process.env.PORT || 5000;                                                  
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

connectToMongoDB();