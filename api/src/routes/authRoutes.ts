import express from 'express';
import { authController } from '../controllers/authController';

const router = express.Router();

// Route for user signup
router.post('/signup', authController.signUp);

// You can add more auth-related routes here (e.g., login)
router.post('/login', authController.login);

export default router;