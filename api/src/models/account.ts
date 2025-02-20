import mongoose, { Document, Schema } from 'mongoose';

interface IAccount extends Document {
    email: string;
    username: string;
    password: string;
}

const AccountSchema = new Schema<IAccount>({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true }
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);