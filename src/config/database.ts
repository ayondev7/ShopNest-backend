import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

export default connectDB;
