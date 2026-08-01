import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Transaction from '../models/Transaction';
import User from '../models/User';

export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { type, status } = req.query;
    const filter: any = { userId: req.userId };

    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error });
  }
};

export const createDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balanceBefore = user.balance;

    const transaction = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount,
      status: 'pending', // Starts as pending until the webhook clears it
      paymentMethod,
      balanceBefore,
      balanceAfter: balanceBefore,
      description: `Deposit via ${paymentMethod} (Awaiting settlement)`,
    });

    await transaction.save();

    res.status(201).json({ 
      message: 'Checkout session created successfully', 
      transaction,
      checkoutUrl: `https://gateway.highriskprocessor.com/pay/${transaction._id}` 
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Deposit failed', error });
  }
};

export const createWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (user.kycStatus !== 'verified') {
      return res.status(400).json({ message: 'KYC verification required for withdrawals' });
    }

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - amount;

    const transaction = new Transaction({
      userId: req.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      paymentMethod,
      balanceBefore,
      balanceAfter,
      description: `Withdrawal via ${paymentMethod}`,
    });

    await transaction.save();

    user.balance = balanceAfter;
    await user.save();

    res.status(201).json({ 
      message: 'Withdrawal request submitted', 
      transaction,
      newBalance: balanceAfter 
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Withdrawal failed', error });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('[WEBHOOK RECEIVED]', payload);

    if (payload.eventType === "PAYMENT_INTENT_SUCCESSFUL") {
      const transaction = await Transaction.findById(payload.referenceId);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction ledger entry not found." });
      }

      if (transaction.status === "completed") {
        return res.status(200).json({ message: "Transaction already cleared and settled." });
      }

      const user = await User.findById(transaction.userId);
      if (!user) {
        return res.status(404).json({ message: "Associated user not found." });
      }

      const finalBalance = user.balance + transaction.amount;

      transaction.status = "completed";
      transaction.balanceAfter = finalBalance;
      transaction.description = `${transaction.description} - Cleared and Settled`;
      await transaction.save();

      user.balance = finalBalance;
      await user.save();

      console.log(`[LEDGER SETTLED] User ${user._id} credited +$${transaction.amount}. Balance: $${finalBalance}`);

      return res.status(200).json({ 
        success: true, 
        message: "Funds successfully settled and credited to balance.",
        newBalance: finalBalance
      });
    }

    return res.status(400).json({ message: "Unhandled event type received." });
  } catch (error) {
    console.error('Webhook processing failure:', error);
    res.status(500).json({ message: 'Internal Webhook Server Error', error });
  }
};