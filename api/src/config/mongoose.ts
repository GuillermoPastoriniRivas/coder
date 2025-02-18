import mongoose from 'mongoose';
import 'dotenv/config';

const mongoConnectionString = process.env.MONGODB_ATLAS_URI as string;

export async function connectToMongoDB() {
    try {
        await mongoose.connect(mongoConnectionString);
        console.log('You successfully connected to MongoDB!');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}