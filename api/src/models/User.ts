import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    username: string;
    saldo: number; 
    usedTokens: number; 
    totalProjectTokens: number; 
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    saldo: { type: Number, default: 0 }, 
    usedTokens: { type: Number, default: 0 }, 
    totalProjectTokens: { type: Number, default: 0 }, 
});

export const User = mongoose.model<IUser>('User', UserSchema);