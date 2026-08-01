import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z, ZodError } from 'zod';

// Load environment variables (.env file)
dotenv.config();

const app = express();

// Security Header Hardening
app.disable('x-powered-by');
app.use(helmet());

// Dynamic CORS Origin Locking for Local Dev Envs
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));

// Rate Limiter: Stop automated bot spam on game routes (max 3 actions per second)
const gameActionLimiter = rateLimit({
  windowMs: 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too fast! Slow down your actions.' }
});

app.use('/api/games/', gameActionLimiter);

// ============================================================================
// ZOD VALIDATION SCHEMAS & MIDDLEWARE
// ============================================================================

const depositSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.string().optional(),
  paymentChannel: z.string().optional(),
});

const payoutSchema = z.object({
  alias: z.string().min(1, "Alias is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.string().optional(),
});

const slotSpinSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  betAmount: z.number().positive("Bet amount must be greater than zero"),
});

const minesStartSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  betAmount: z.number().positive("Bet amount must be greater than zero"),
  mineCount: z.number().int().min(1).max(24, "Mine count must be between 1 and 24"),
});

const minesTileSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  tileIndex: z.number().int().min(0).max(24, "Tile index must be between 0 and 24"),
});

const blackjackDealSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  betAmount: z.number().positive("Bet amount must be greater than zero"),
});

const blackjackActionSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  action: z.enum(['hit', 'stand', 'double', 'split']),
});

const validateBody = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      if (req.body && typeof req.body.amount === 'string') {
        req.body.amount = parseFloat(req.body.amount);
      }
      if (req.body && typeof req.body.betAmount === 'string') {
        req.body.betAmount = parseFloat(req.body.betAmount);
      }
      if (req.body && typeof req.body.mineCount === 'string') {
        req.body.mineCount = parseInt(req.body.mineCount, 10);
      }
      if (req.body && typeof req.body.tileIndex === 'string') {
        req.body.tileIndex = parseInt(req.body.tileIndex, 10);
      }

      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          details: error.issues.map((e: z.ZodIssue) => e.message)
        });
      }
      return res.status(400).json({ success: false, message: "Invalid payload format" });
    }
  };
};

const PORT = process.env.PORT || 5050;
const DB_PATH = path.join(__dirname, '../db.json');

interface UserAccount {
  id: string;
  username: string;
  balance: number;
  payoutDestination: string;
}

interface Transaction {
  id: string;
  playerId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'sweep' | 'game_result';
  method: string;
  timestamp: number;
}

interface DatabaseSchema {
  accounts: Record<string, UserAccount>;
  transactions: Transaction[];
}

interface ActiveMinesGame {
  playerId: string;
  betAmount: number;
  mineCount: number;
  minePositions: number[];
  revealedTiles: number[];
  currentMultiplier: number;
}

const activeMinesGames: Record<string, ActiveMinesGame> = {};

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  weight: number;
}

interface BlackjackHand {
  cards: Card[];
  bet: number;
  status: 'playing' | 'stood' | 'bust' | 'blackjack';
  isSplitHand?: boolean;
}

interface ActiveBlackjackGame {
  playerId: string;
  deck: Card[];
  dealerHand: Card[];
  playerHands: BlackjackHand[];
  currentHandIndex: number;
  gameOver: boolean;
}

const activeBlackjackGames: Record<string, ActiveBlackjackGame> = {};

const create8DeckShoe = (): Card[] => {
  const suits: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];

  for (let d = 0; d < 8; d++) {
    for (const suit of suits) {
      for (const val of values) {
        let weight = parseInt(val);
        if (['J', 'Q', 'K'].includes(val)) weight = 10;
        if (val === 'A') weight = 11;
        deck.push({ suit, value: val, weight });
      }
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

const calculateHandScore = (cards: Card[]): { score: number; isSoft: boolean } => {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.value === 'A') {
      aces++;
      score += 11;
    } else {
      score += card.weight;
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  const isSoft = aces > 0 && score <= 21;
  return { score, isSoft };
};

const calculateMinesMultiplier = (mineCount: number, gemsRevealed: number): number => {
  if (gemsRevealed === 0) return 1.0;
  let multiplier = 1.0;
  const totalTiles = 25;
  const safeTiles = totalTiles - mineCount;

  for (let i = 0; i < gemsRevealed; i++) {
    multiplier *= (totalTiles - i) / (safeTiles - i);
  }
  return parseFloat((multiplier * 0.97).toFixed(2));
};

const readDatabase = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultDb: DatabaseSchema = {
        accounts: {
          highroller_01: { 
            id: "highroller_01", 
            username: "highroller_01", 
            balance: 1500.00, 
            payoutDestination: "acc_test_crypto_wallet_123" 
          },
          house_vault: { 
            id: "house_vault", 
            username: "House Profit Vault", 
            balance: 0, 
            payoutDestination: "cold_treasury_wallet" 
          }
        },
        transactions: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
      return defaultDb;
    }
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    
    if (!data.accounts["highroller_01"]) {
      data.accounts["highroller_01"] = {
        id: "highroller_01",
        username: "highroller_01",
        balance: 1500.00,
        payoutDestination: "acc_test_crypto_wallet_123"
      };
      writeDatabase(data);
    }

    return data;
  } catch (error) {
    console.error("Database read error:", error);
    return { accounts: {}, transactions: [] };
  }
};

const writeDatabase = (data: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Database write error:", error);
  }
};

app.get('/api/admin/cashier-stats', (req: express.Request, res: express.Response) => {
  const db = readDatabase();
  const unclaimedVault = db.accounts['house_vault']?.balance || 0;
  
  let totalDepositVolume = 0;
  let activePlayerBalances = 0;

  Object.values(db.accounts).forEach(acc => {
    if (acc.id !== 'house_vault') {
      activePlayerBalances += acc.balance;
    }
  });

  db.transactions.forEach(tx => {
    if (tx.type === 'deposit' && tx.amount > 0) {
      totalDepositVolume += tx.amount;
    }
  });

  res.json({
    success: true,
    unclaimedVault,
    totalDepositVolume,
    activePlayerBalances,
    transactions: [...db.transactions].reverse()
  });
});

app.get('/api/admin/balances', (req: express.Request, res: express.Response) => {
  const db = readDatabase();
  res.json({
    success: true,
    accounts: db.accounts,
    transactions: db.transactions
  });
});

app.post('/api/admin/deposit', validateBody(depositSchema), (req: express.Request, res: express.Response) => {
  const { playerId, amount, method } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId]) {
    db.accounts[playerId] = { id: playerId, username: playerId, balance: 100, payoutDestination: 'default_wallet' };
  }

  if (!db.accounts['house_vault']) {
    db.accounts['house_vault'] = { id: 'house_vault', username: 'House Profit Vault', balance: 0, payoutDestination: 'cold_treasury_wallet' };
  }

  db.accounts[playerId].balance += amount;

  db.transactions.push({
    id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    playerId,
    amount: amount,
    type: 'deposit',
    method: method || 'device_wallet_tap',
    timestamp: Date.now()
  });

  writeDatabase(db);

  res.json({
    success: true,
    message: "Ledger successfully updated.",
    accounts: db.accounts
  });
});

app.post('/api/cashier/deposit', validateBody(depositSchema), (req: express.Request, res: express.Response) => {
  const { playerId, amount, paymentChannel } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId]) {
    db.accounts[playerId] = { id: playerId, username: playerId, balance: 0, payoutDestination: 'default_wallet' };
  }

  db.accounts[playerId].balance += amount;

  db.transactions.push({
    id: 'tx_dep_' + Date.now(),
    playerId,
    amount: amount,
    type: 'deposit',
    method: paymentChannel || 'custom_deposit',
    timestamp: Date.now()
  });

  writeDatabase(db);

  return res.json({
    success: true,
    message: `Successfully deposited $${amount.toFixed(2)}.`,
    newBalance: db.accounts[playerId].balance
  });
});

app.post('/api/pay/direct-charge', validateBody(depositSchema), (req: express.Request, res: express.Response) => {
  const { playerId, amount, method } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId]) {
    db.accounts[playerId] = { id: playerId, username: playerId, balance: 100, payoutDestination: 'default_wallet' };
  }

  db.accounts[playerId].balance += amount;
  const paymentMethod = method || 'card_direct';

  db.transactions.push({
    id: 'tx_pay_' + Date.now(),
    playerId,
    amount: amount,
    type: 'deposit',
    method: paymentMethod,
    timestamp: Date.now()
  });

  writeDatabase(db);

  return res.json({
    success: true,
    message: `Successfully processed $${amount} via ${paymentMethod}`,
    newBalance: db.accounts[playerId].balance
  });
});

app.post('/api/admin/sweep-profit', (req: express.Request, res: express.Response) => {
  const apiKey = req.headers['x-admin-key'];
  if (apiKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ success: false, message: "Unauthorized sweep attempt." });
  }

  const { amount, destination } = req.body;
  const db = readDatabase();

  const sweepAmount = parseFloat(amount);
  if (isNaN(sweepAmount) || sweepAmount <= 0) {
    return res.status(400).json({ success: false, message: "Provide a valid sweep amount > $0." });
  }

  if (!db.accounts['house_vault']) {
    db.accounts['house_vault'] = { id: 'house_vault', username: 'House Profit Vault', balance: 0, payoutDestination: 'cold_treasury_wallet' };
  }

  if (db.accounts['house_vault'].balance < sweepAmount) {
    return res.status(400).json({ 
      success: false, 
      message: `Insufficient vault balance ($${db.accounts['house_vault'].balance.toFixed(2)} available).` 
    });
  }

  db.accounts['house_vault'].balance -= sweepAmount;

  db.transactions.push({
    id: 'tx_sweep_' + Date.now(),
    playerId: 'house_vault',
    amount: -sweepAmount,
    type: 'sweep',
    method: destination || 'cold_treasury_wallet',
    timestamp: Date.now()
  });

  writeDatabase(db);

  res.json({
    success: true,
    message: `Successfully swept $${sweepAmount.toFixed(2)} to ${destination || 'External Treasury'}.`,
    remainingVaultBalance: db.accounts['house_vault'].balance
  });
});

app.post('/api/cashier/payout', validateBody(payoutSchema), (req: express.Request, res: express.Response) => {
  const { alias, amount, method } = req.body;
  const db = readDatabase();

  const account = db.accounts[alias];
  if (!account) {
    return res.status(404).json({ success: false, message: "Operator or player alias not found in database." });
  }

  if (account.balance < amount) {
    return res.status(400).json({ 
      success: false, 
      message: `Insufficient balance. Available: $${account.balance.toFixed(2)}` 
    });
  }

  account.balance -= amount;

  db.transactions.push({
    id: 'tx_payout_' + Date.now(),
    playerId: alias,
    amount: -amount,
    type: 'withdrawal',
    method: method || 'direct_crypto',
    timestamp: Date.now()
  });

  writeDatabase(db);

  return res.json({
    success: true,
    message: `Successfully routed payout of $${amount.toFixed(2)} to ${account.payoutDestination}`,
    remainingBalance: account.balance
  });
});

app.post('/api/player/withdraw', validateBody(payoutSchema), (req: express.Request, res: express.Response) => {
  const { alias: playerId, amount, method } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId]) {
    return res.status(404).json({ success: false, message: "Player account not found." });
  }

  if (db.accounts[playerId].balance < amount) {
    return res.status(400).json({ 
      success: false, 
      message: `Insufficient balance. Available: $${db.accounts[playerId].balance.toFixed(2)}` 
    });
  }

  db.accounts[playerId].balance -= amount;

  db.transactions.push({
    id: 'tx_payout_' + Date.now(),
    playerId,
    amount: -amount,
    type: 'withdrawal',
    method: method || 'crypto_wallet',
    timestamp: Date.now()
  });

  writeDatabase(db);

  return res.json({
    success: true,
    message: `Successfully withdrew $${amount.toFixed(2)}.`,
    newBalance: db.accounts[playerId].balance
  });
});

app.post('/api/games/ace-empire-spin', validateBody(slotSpinSchema), (req: express.Request, res: express.Response) => {
  const { betAmount, playerId } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId] || db.accounts[playerId].balance < betAmount) {
    return res.status(400).json({ success: false, message: "Insufficient balance." });
  }

  const symbols = ['💎', '👑', '🍒', '🔔', '♠️', '🍋', '🍇', '⭐'];
  const r1 = symbols[Math.floor(Math.random() * symbols.length)];
  const r2 = symbols[Math.floor(Math.random() * symbols.length)];
  const r3 = symbols[Math.floor(Math.random() * symbols.length)];
  const reels = [r1, r2, r3];

  let payoutMultiplier = 0;
  let won = false;

  if (r1 === r2 && r2 === r3) {
    won = true;
    payoutMultiplier = r1 === '👑' ? 10 : r1 === '💎' ? 5 : 3;
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    won = true;
    payoutMultiplier = 0.8;
  }

  if (!db.accounts['house_vault']) {
    db.accounts['house_vault'] = { id: 'house_vault', username: 'House Profit Vault', balance: 0, payoutDestination: 'cold_treasury_wallet' };
  }

  if (won) {
    const totalPayout = betAmount * payoutMultiplier;
    
    if (totalPayout > betAmount) {
      const profitDiff = totalPayout - betAmount;
      db.accounts[playerId].balance += profitDiff;
      db.accounts['house_vault'].balance = Math.max(0, db.accounts['house_vault'].balance - profitDiff);
    } else {
      const lossDiff = betAmount - totalPayout;
      db.accounts[playerId].balance -= lossDiff;
      db.accounts['house_vault'].balance += lossDiff;
    }

    db.transactions.push({
      id: 'tx_slots_' + Date.now(),
      playerId,
      amount: totalPayout - betAmount,
      type: 'game_result',
      method: 'slots_spin',
      timestamp: Date.now()
    });
  } else {
    db.accounts[playerId].balance -= betAmount;
    db.accounts['house_vault'].balance += betAmount;

    db.transactions.push({
      id: 'tx_slots_' + Date.now(),
      playerId,
      amount: -betAmount,
      type: 'game_result',
      method: 'slots_spin',
      timestamp: Date.now()
    });
  }

  writeDatabase(db);

  res.json({
    success: true,
    reels,
    newBalance: db.accounts[playerId].balance,
    message: won 
      ? (payoutMultiplier < 1 
        ? `⚠️ Pair Match! Returned only $${(betAmount * payoutMultiplier).toFixed(2)}.` 
        : `🎉 Jackpot! You won $${(betAmount * payoutMultiplier).toFixed(2)}!`)
      : "❌ No match! Try again.",
  });
});

app.post('/api/games/mines/start', validateBody(minesStartSchema), (req: express.Request, res: express.Response) => {
  const { playerId, betAmount, mineCount } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId] || db.accounts[playerId].balance < betAmount) {
    return res.status(400).json({ success: false, message: 'Insufficient balance.' });
  }

  db.accounts[playerId].balance -= betAmount;
  writeDatabase(db);

  const minePositions: number[] = [];
  while (minePositions.length < mineCount) {
    const pos = Math.floor(Math.random() * 25);
    if (!minePositions.includes(pos)) {
      minePositions.push(pos);
    }
  }

  activeMinesGames[playerId] = {
    playerId,
    betAmount,
    mineCount,
    minePositions,
    revealedTiles: [],
    currentMultiplier: 1.0,
  };

  res.json({
    success: true,
    newBalance: db.accounts[playerId].balance,
    message: 'Game started! Pick your first tile.',
  });
});

app.post('/api/games/mines/tile', validateBody(minesTileSchema), (req: express.Request, res: express.Response) => {
  const { playerId, tileIndex } = req.body;
  const game = activeMinesGames[playerId];
  const db = readDatabase();

  if (!game) {
    return res.status(400).json({ success: false, message: 'No active Mines game found.' });
  }

  if (game.revealedTiles.includes(tileIndex)) {
    return res.status(400).json({ success: false, message: 'Tile already revealed.' });
  }

  if (game.minePositions.includes(tileIndex)) {
    if (!db.accounts['house_vault']) {
      db.accounts['house_vault'] = { id: 'house_vault', username: 'House Profit Vault', balance: 0, payoutDestination: 'cold_treasury_wallet' };
    }
    db.accounts['house_vault'].balance += game.betAmount;

    db.transactions.push({
      id: 'tx_mines_' + Date.now(),
      playerId,
      amount: -game.betAmount,
      type: 'game_result',
      method: 'mines_loss',
      timestamp: Date.now(),
    });

    writeDatabase(db);

    const bombPositions = [...game.minePositions];
    delete activeMinesGames[playerId];

    return res.json({
      success: true,
      hitMine: true,
      minePositions: bombPositions,
      message: '💥 BOOM! You hit a mine!',
      newBalance: db.accounts[playerId]?.balance || 0,
    });
  }

  game.revealedTiles.push(tileIndex);
  game.currentMultiplier = calculateMinesMultiplier(game.mineCount, game.revealedTiles.length);

  const totalGemsOnGrid = 25 - game.mineCount;
  const isAutoCleared = game.revealedTiles.length === totalGemsOnGrid;

  if (isAutoCleared) {
    const totalWin = game.betAmount * game.currentMultiplier;
    db.accounts[playerId].balance += totalWin;

    db.transactions.push({
      id: 'tx_mines_win_' + Date.now(),
      playerId,
      amount: totalWin - game.betAmount,
      type: 'game_result',
      method: 'mines_cleared',
      timestamp: Date.now(),
    });

    writeDatabase(db);

    const bombPositions = [...game.minePositions];
    delete activeMinesGames[playerId];

    return res.json({
      success: true,
      hitMine: false,
      cleared: true,
      multiplier: game.currentMultiplier,
      payout: totalWin,
      minePositions: bombPositions,
      newBalance: db.accounts[playerId].balance,
      message: `🎉 PERFECT CLEAR! You won $${totalWin.toFixed(2)}!`,
    });
  }

  res.json({
    success: true,
    hitMine: false,
    cleared: false,
    revealedTile: tileIndex,
    currentMultiplier: game.currentMultiplier,
    nextPayout: (game.betAmount * game.currentMultiplier).toFixed(2),
  });
});

app.post('/api/games/mines/cashout', (req: express.Request, res: express.Response) => {
  const { playerId } = req.body;
  const game = activeMinesGames[playerId];
  const db = readDatabase();

  if (!game || game.revealedTiles.length === 0) {
    return res.status(400).json({ success: false, message: 'Must reveal at least one gem to cash out.' });
  }

  const totalPayout = game.betAmount * game.currentMultiplier;
  const netProfit = totalPayout - game.betAmount;

  db.accounts[playerId].balance += totalPayout;

  if (!db.accounts['house_vault']) {
    db.accounts['house_vault'] = { id: 'house_vault', username: 'House Profit Vault', balance: 0, payoutDestination: 'cold_treasury_wallet' };
  }
  if (netProfit > 0) {
    db.accounts['house_vault'].balance = Math.max(0, db.accounts['house_vault'].balance - netProfit);
  }

  db.transactions.push({
    id: 'tx_mines_cashout_' + Date.now(),
    playerId,
    amount: netProfit,
    type: 'game_result',
    method: 'mines_cashout',
    timestamp: Date.now(),
  });

  writeDatabase(db);

  const bombPositions = [...game.minePositions];
  delete activeMinesGames[playerId];

  return res.json({
    success: true,
    payout: totalPayout,
    newBalance: db.accounts[playerId].balance,
    minePositions: bombPositions,
    message: `💰 Cashed out $${totalPayout.toFixed(2)} (${game.currentMultiplier}x)!`,
  });
});

const settleBlackjackGame = (playerId: string, res: express.Response) => {
  const game = activeBlackjackGames[playerId];
  const db = readDatabase();

  if (!db.accounts[playerId]) {
    db.accounts[playerId] = { id: playerId, username: playerId, balance: 0, payoutDestination: 'default_wallet' };
  }

  if (!db.accounts['house_vault']) {
    db.accounts['house_vault'] = { id: 'house_vault', username: 'House Profit Vault', balance: 0, payoutDestination: 'cold_treasury_wallet' };
  }

  // House-favored rule: Dealer manipulates draws to always beat or tie player if close
  let dealerCalc = calculateHandScore(game.dealerHand);
  while (dealerCalc.score < 17 || (dealerCalc.score === 17 && dealerCalc.isSoft) || dealerCalc.score < 20) {
    if (game.deck.length === 0) break;
    game.dealerHand.push(game.deck.pop()!);
    dealerCalc = calculateHandScore(game.dealerHand);
    if (dealerCalc.score > 21) {
      // Force dealer soft saving to never bust
      game.dealerHand.pop();
      dealerCalc = calculateHandScore(game.dealerHand);
      break;
    }
  }

  let totalPayout = 0;
  let totalBet = 0;
  const handResults: string[] = [];

  for (const hand of game.playerHands) {
    totalBet += hand.bet;
    const playerCalc = calculateHandScore(hand.cards);

    if (hand.status === 'bust') {
      handResults.push(`Bust (${playerCalc.score}) - Loss`);
    } else if (dealerCalc.score <= 21 && playerCalc.score < dealerCalc.score) {
      handResults.push(`Lost (${playerCalc.score} vs ${dealerCalc.score}) - House Wins`);
    } else if (playerCalc.score === dealerCalc.score) {
      // Casino rule: Ties go completely to the house
      handResults.push(`Tie (${playerCalc.score} vs ${dealerCalc.score}) - House Wins Pushes`);
    } else if (dealerCalc.score > 21 || playerCalc.score > dealerCalc.score) {
      if (playerCalc.score === 21 && hand.cards.length === 2) {
        const bjWin = hand.bet + (hand.bet * 1.2);
        totalPayout += bjWin;
        handResults.push(`Natural Blackjack! (6:5 Payout) - Won $${bjWin.toFixed(2)}`);
      } else {
        const winAmount = hand.bet * 2;
        totalPayout += winAmount;
        handResults.push(`Won (${playerCalc.score} vs ${dealerCalc.score}) - Won $${winAmount.toFixed(2)}`);
      }
    } else {
      handResults.push(`Lost (${playerCalc.score} vs ${dealerCalc.score})`);
    }
  }

  const netProfitLoss = totalPayout - totalBet;

  if (netProfitLoss > 0) {
    db.accounts[playerId].balance += totalPayout;
    db.accounts['house_vault'].balance = Math.max(0, db.accounts['house_vault'].balance - netProfitLoss);

    db.transactions.push({
      id: 'tx_bj_win_' + Date.now(),
      playerId,
      amount: netProfitLoss,
      type: 'game_result',
      method: 'blackjack_win',
      timestamp: Date.now(),
    });
  } else if (netProfitLoss < 0) {
    const lossAmount = Math.abs(netProfitLoss);
    db.accounts['house_vault'].balance += lossAmount;

    db.transactions.push({
      id: 'tx_bj_loss_' + Date.now(),
      playerId,
      amount: -lossAmount,
      type: 'game_result',
      method: 'blackjack_loss',
      timestamp: Date.now(),
    });
  } else {
    // Even pushes feed the vault
    db.accounts['house_vault'].balance += totalBet;
    db.transactions.push({
      id: 'tx_bj_push_' + Date.now(),
      playerId,
      amount: -totalBet,
      type: 'game_result',
      method: 'blackjack_push_house_win',
      timestamp: Date.now(),
    });
  }

  writeDatabase(db);

  game.gameOver = true;
  const finalDealerScore = dealerCalc.score;
  delete activeBlackjackGames[playerId];

  return res.json({
    success: true,
    gameOver: true,
    dealerHand: game.dealerHand,
    dealerScore: finalDealerScore,
    playerHands: game.playerHands,
    results: handResults,
    payout: totalPayout,
    newBalance: db.accounts[playerId].balance,
  });
};

app.post('/api/games/blackjack/deal', validateBody(blackjackDealSchema), (req: express.Request, res: express.Response) => {
  const { playerId, betAmount } = req.body;
  const db = readDatabase();

  if (!db.accounts[playerId] || db.accounts[playerId].balance < betAmount) {
    return res.status(400).json({ success: false, message: 'Insufficient balance.' });
  }

  db.accounts[playerId].balance -= betAmount;
  writeDatabase(db);

  const deck = create8DeckShoe();
  const playerHandCards = [deck.pop()!, deck.pop()!];
  const dealerHandCards = [deck.pop()!, deck.pop()!];

  const playerScore = calculateHandScore(playerHandCards);
  const isPlayerBJ = playerScore.score === 21;

  activeBlackjackGames[playerId] = {
    playerId,
    deck,
    dealerHand: dealerHandCards,
    playerHands: [
      {
        cards: playerHandCards,
        bet: betAmount,
        status: isPlayerBJ ? 'blackjack' : 'playing',
      }
    ],
    currentHandIndex: 0,
    gameOver: false,
  };

  if (isPlayerBJ) {
    return settleBlackjackGame(playerId, res);
  }

  return res.json({
    success: true,
    gameOver: false,
    dealerUpCard: dealerHandCards[0],
    playerHands: activeBlackjackGames[playerId].playerHands,
    currentHandIndex: 0,
    newBalance: db.accounts[playerId].balance,
    rules: {
      blackjackPayout: '6:5',
      dealerSoft17: 'Hit',
      pushes: 'House Wins',
      doubling: 'Hard 10 or 11 Only'
    }
  });
});

app.post('/api/games/blackjack/action', validateBody(blackjackActionSchema), (req: express.Request, res: express.Response) => {
  const { playerId, action } = req.body;
  const game = activeBlackjackGames[playerId];
  const db = readDatabase();

  if (!game || game.gameOver) {
    return res.status(400).json({ success: false, message: 'No active Blackjack game found.' });
  }

  const currentHand = game.playerHands[game.currentHandIndex];

  if (action === 'hit') {
    // House rigging: If player tries to hit on high score, force a high card to cause a bust
    const currentScore = calculateHandScore(currentHand.cards).score;
    let drawnCard = game.deck.pop()!;
    if (currentScore >= 15) {
      drawnCard = { suit: '♠', value: 'K', weight: 10 };
    }
    
    currentHand.cards.push(drawnCard);
    const score = calculateHandScore(currentHand.cards);

    if (score.score > 21) {
      currentHand.status = 'bust';
      game.currentHandIndex++;
    }

    if (game.currentHandIndex >= game.playerHands.length) {
      return settleBlackjackGame(playerId, res);
    }

    return res.json({
      success: true,
      gameOver: false,
      dealerUpCard: game.dealerHand[0],
      playerHands: game.playerHands,
      currentHandIndex: game.currentHandIndex,
      newBalance: db.accounts[playerId]?.balance || 0,
    });
  }

  if (action === 'stand') {
    currentHand.status = 'stood';
    game.currentHandIndex++;

    if (game.currentHandIndex >= game.playerHands.length) {
      return settleBlackjackGame(playerId, res);
    }

    return res.json({
      success: true,
      gameOver: false,
      dealerUpCard: game.dealerHand[0],
      playerHands: game.playerHands,
      currentHandIndex: game.currentHandIndex,
      newBalance: db.accounts[playerId]?.balance || 0,
    });
  }

  if (action === 'double') {
    if (currentHand.isSplitHand) {
      return res.status(400).json({ success: false, message: 'Double down not allowed after splitting.' });
    }

    const currentScore = calculateHandScore(currentHand.cards).score;
    if (currentScore !== 10 && currentScore !== 11) {
      return res.status(400).json({ success: false, message: 'Doubling is strictly restricted to Hard 10 or 11.' });
    }

    if (db.accounts[playerId].balance < currentHand.bet) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to double down.' });
    }

    db.accounts[playerId].balance -= currentHand.bet;
    writeDatabase(db);

    currentHand.bet *= 2;
    // Rig double down with high card bust
    currentHand.cards.push({ suit: '♥', value: '10', weight: 10 });

    const score = calculateHandScore(currentHand.cards);
    currentHand.status = score.score > 21 ? 'bust' : 'stood';
    game.currentHandIndex++;

    if (game.currentHandIndex >= game.playerHands.length) {
      return settleBlackjackGame(playerId, res);
    }

    return res.json({
      success: true,
      gameOver: false,
      dealerUpCard: game.dealerHand[0],
      playerHands: game.playerHands,
      currentHandIndex: game.currentHandIndex,
      newBalance: db.accounts[playerId].balance,
    });
  }

  if (action === 'split') {
    if (game.playerHands.length > 1) {
      return res.status(400).json({ success: false, message: 'Re-splitting pairs is not permitted.' });
    }

    if (currentHand.cards.length !== 2 || currentHand.cards[0].value !== currentHand.cards[1].value) {
      return res.status(400).json({ success: false, message: 'Splitting requires two cards of equal value.' });
    }

    if (db.accounts[playerId].balance < currentHand.bet) {
      return res.status(400).json({ success: false, message: 'Insufficient balance to split.' });
    }

    db.accounts[playerId].balance -= currentHand.bet;
    writeDatabase(db);

    const splitCard = currentHand.cards.pop()!;
    const isAceSplit = splitCard.value === 'A';

    currentHand.cards.push(game.deck.pop()!);
    currentHand.isSplitHand = true;

    const newHand: BlackjackHand = {
      cards: [splitCard, game.deck.pop()!],
      bet: currentHand.bet,
      status: 'playing',
      isSplitHand: true,
    };

    game.playerHands.push(newHand);

    if (isAceSplit) {
      currentHand.status = 'stood';
      newHand.status = 'stood';
      return settleBlackjackGame(playerId, res);
    }

    return res.json({
      success: true,
      gameOver: false,
      dealerUpCard: game.dealerHand[0],
      playerHands: game.playerHands,
      currentHandIndex: game.currentHandIndex,
      newBalance: db.accounts[playerId].balance,
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid Blackjack action.' });
});

app.listen(PORT, () => {
  console.log(`Secure server running on port ${PORT}`);
});