import { Router } from 'express';
import { 
  getUserTransactions, 
  createDeposit, 
  createWithdrawal, 
  handleWebhook 
} from '../controllers/transaction.controller';
// Using the exact function name from your middleware file
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Regular user account routes (Protected by authentication)
router.get('/', authenticateToken, getUserTransactions);
router.post('/deposit', authenticateToken, createDeposit);
router.post('/withdrawal', authenticateToken, createWithdrawal);

// Webhook Listener endpoint (No authentication needed for external webhooks)
router.post('/webhook', handleWebhook);

export default router;