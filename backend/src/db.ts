import mongoose from 'mongoose';

// Your local development connection string
const MONGO_URI = 'mongodb://127.0.0.1:27017/cassanova_ledger';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log('==================================================');
    console.log('[DATABASE SUCCESS] Connected to Secure Ledger Node');
    console.log('==================================================');
  } catch (error: any) {
    console.error('❌ [DATABASE FATAL] Connection failed:', error.message);
    process.exit(1); 
  }
};