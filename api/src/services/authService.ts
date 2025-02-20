import { accountRepository } from '../repositories/accountRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = '1h';

export const authService = {
    async authenticateUser(email: string, password: string): Promise<string | null> {
        const account = await accountRepository.getAccountByEmail(email);
        if (!account) return null;

        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) return null;

        const token = jwt.sign({ email: account.email, id: account._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return token;
    }
};