import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const token = await authService.authenticateUser(email, password);
            if (token) {
                res.json({ token });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
        
    },
    async signUp(req: Request, res: Response) {
        try {
            const { email, password, username } = req.body;
            const account = await authService.registerUser(email, password, username);
            res.status(201).json({ message: 'Account created successfully', account });
        } catch (error) {
            console.error('SignUp error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};