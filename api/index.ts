import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { connectToMongoDB } from './src/config/mongoose';
import { accountController } from './src/controllers/accountController';
import { authMiddleware } from './src/middleware/authMiddleware';
import { authController } from './src/controllers/authController';
import { syncController } from './src/controllers/syncController';
import { postCall, getConversations, getConversation, updateConversationTitle, deleteConversation } from './src/controllers/chatController';
import { userController } from './src/controllers/userController';
import { purchaseController } from './src/controllers/purchaseController';
import { paymentController } from './src/controllers/paymentController';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

const app: Express = express();
app.use(express.json({ limit: "100mb" })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: "100mb", extended: true })); // Increased limit

app.use(cors());

// Configure Multer for file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: async (req: any, file: any, cb: any) => {
            // @ts-ignore
            const userId = req.user.id;
            const folderName = req.body.folder; // Assuming folder name is sent in body
            if (!userId || !folderName) {
                return cb(new Error('User ID or folder name not provided'), '');
            }
            const safeUserId = userId.replace(/[/\\]/g, '_');
            const safeFolderName = folderName.replace(/[/\\]/g, '_');
            const attachmentsDir = path.resolve(process.cwd(), 'sources', safeUserId, safeFolderName, 'attachments');
            await fs.mkdir(attachmentsDir, { recursive: true });
            cb(null, attachmentsDir);
        },
        filename: (req: any, file: any, cb: any) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileExtension = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
        }
    }),
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG images are allowed.'), false);
        }
    }
});

app.get('/', (req: Request, res: Response) => {
    res.send('Agent Server');
});

// Serve static attachment files
app.use('/attachments', express.static(path.join(process.cwd(), 'sources')));

app.post('/signup', authController.signUp);
app.post('/login', authController.login);

// Protected Routes
app.post('/call', authMiddleware, upload.single('attachment'), postCall); // Added multer middleware

app.post('/conversation', authMiddleware, getConversation);
app.delete('/conversation/:conversationId', authMiddleware, deleteConversation);

app.get('/account', authMiddleware, accountController.getAccount);
app.put('/account', authMiddleware, accountController.updateAccount);

app.post('/sync', authMiddleware, syncController.sync);

app.get('/conversations/:folder', authMiddleware, getConversations);

app.get('/saldo', authMiddleware, userController.getSaldo);

// Purchase and Payment Routes
app.post('/purchase-tokens', authMiddleware, purchaseController.purchaseTokens);
app.get('/purchase-history', authMiddleware, purchaseController.getPurchaseHistory);
app.post('/create-payment-intent', paymentController.createPaymentIntent);

app.put('/conversation/:conversationId/title', authMiddleware, updateConversationTitle);

// Call History Route
app.get('/call-history', authMiddleware, userController.getCallHistory);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

connectToMongoDB();