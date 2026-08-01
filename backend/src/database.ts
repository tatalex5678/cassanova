import fs from 'fs';
import path from 'path';

// This defines where your local ledger database file will live on your computer
const DB_FILE = path.join(__dirname, '../db.json');

export interface UserAccount {
  id: string;
  username: string;
  balance: number;
  payoutDestination: string; // Added to store where real money routes
}

export interface Transaction {
  id: string;
  playerId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  method: 'physical_cash' | 'direct_crypto' | 'device_wallet_tap';
  timestamp: number;
}

interface DatabaseSchema {
  accounts: Record<string, UserAccount>;
  transactions: Transaction[];
}

// Default starting data for testing, including highroller_01
const defaultData: DatabaseSchema = {
  accounts: {
    "highroller_01": { 
      id: "highroller_01", 
      username: "highroller_01", 
      balance: 1500.00, 
      payoutDestination: "acc_test_crypto_wallet_123" 
    }
  },
  transactions: []
};

// Helper function to read the database file
export const loadDB = (): DatabaseSchema => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  // Ensure highroller_01 exists if db.json already existed without it
  if (!data.accounts["highroller_01"]) {
    data.accounts["highroller_01"] = {
      id: "highroller_01",
      username: "highroller_01",
      balance: 1500.00,
      payoutDestination: "acc_test_crypto_wallet_123"
    };
    saveDB(data);
  }
  return data;
};

// Helper function to write/update the database file
export const saveDB = (data: DatabaseSchema) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};