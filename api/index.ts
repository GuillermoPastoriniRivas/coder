import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { connectToMongoDB } from './src/config/mongoose';
import { accountController } from './src/controllers/accountController';
import { authMiddleware } from './src/middleware/authMiddleware';
import { authController } from './src/controllers/authController';
import { syncController } from './src/controllers/syncController';
import { postCall, getConversations, getConversation, updateConversationTitle, deleteConversation } from './src/controllers/chatController'; // Agregado deleteConversation
import { userController } from './src/controllers/userController';
import { purchaseController } from './src/controllers/purchaseController';
import { paymentController } from './src/controllers/paymentController';

const app: Express = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors());

app.get('/', (req: Request, res: Response) => {
    res.send('Agent Server');
});

app.post('/signup', authController.signUp);
app.post('/login', authController.login);

// Protected Routes
app.post('/call', authMiddleware, postCall);

app.post('/conversation', authMiddleware, getConversation);
app.delete('/conversation/:conversationId', authMiddleware, deleteConversation); // Agregado endpoint para eliminar conversación

app.get('/account', authMiddleware, accountController.getAccount);
app.put('/account', authMiddleware, accountController.updateAccount);

app.post('/sync', authMiddleware, syncController.sync);
//app.post('/update-vectors', authMiddleware, syncController.updateVectors); // Deprecated route

app.get('/conversations/:folder', authMiddleware, getConversations);

app.get('/saldo', authMiddleware, userController.getSaldo);

// Purchase and Payment Routes
app.post('/purchase-tokens', authMiddleware, purchaseController.purchaseTokens);
app.get('/purchase-history', authMiddleware, purchaseController.getPurchaseHistory); // Added history endpoint
app.post('/create-payment-intent', paymentController.createPaymentIntent);

app.put('/conversation/:conversationId/title', authMiddleware, updateConversationTitle);

// Call History Route
app.get('/call-history', authMiddleware, userController.getCallHistory); // Added call history endpoint

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

connectToMongoDB();