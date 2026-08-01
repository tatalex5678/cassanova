import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  currency: 'USD' | 'SOL' | 'BTC';
  referenceId: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  currency: { type: String, enum: ['USD', 'SOL', 'BTC'], default: 'USD' },
  referenceId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);