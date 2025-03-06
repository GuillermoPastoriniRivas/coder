import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { IUser } from '../models/User'; // Import IUser interface

export const authController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const token = await authService.authenticateUser(email, password);
            if (token) {
                // Fetch user to get saldo
                const user: IUser | null = await authService.getUserByEmail(email);
                if (user) {
                    res.json({ token, saldo: user.saldo });
                } else {
                    res.status(404).json({ error: 'User not found' });
                }
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
            res.status(201).json({ message: 'Account created successfully', account: { email: account.email, username: account.username, saldo: account.saldo } });
        } catch (error) {
            console.error('SignUp error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};