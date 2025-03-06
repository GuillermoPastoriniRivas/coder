import { User, IUser } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authService = {
    registerUser: async (email: string, password: string, username: string) => {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Account with this email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with initial saldo
        const newUser: IUser = new User({
            email,
            password: hashedPassword,
            username,
            saldo: 5, // Initialize saldo to 10
        });

        await newUser.save();

        return newUser;
    },

    authenticateUser: async (email: string, password: string) => {
        const user = await User.findOne({ email });
        if (!user) {
            return null;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return null;
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
            expiresIn: '24h',
        });

        return token;
    },

    getUserByEmail: async (email: string) => {
        return await User.findOne({ email });
    },
};