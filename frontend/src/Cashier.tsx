import React, { useState, useEffect } from 'react';

interface UserAccount {
  id: string;
  username: string;
  balance: number;
}

interface Transaction {
  id: string;
  playerId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  method: string;
  timestamp: number;
}

interface CashierProps {
  onTransactionSuccess?: () => void;
}

export default function Cashier({ onTransactionSuccess }: CashierProps) {
  const [accounts, setAccounts] = useState<Record<string, UserAccount>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Settlement states
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'direct_crypto' | 'device_wallet_tap'>('device_wallet_tap');
  
  // Sweep states
  const [sweepAmount, setSweepAmount] = useState<string>('');
  const [destinationWallet, setDestinationWallet] = useState<string>('0x71C...BusinessTreasury');

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);

  const refreshLedger = async () => {
    try {
      const res = await fetch('http://localhost:5050/api/admin/balances');
      const data = await res.json();
      const loadedAccounts = data.accounts || {};
      setAccounts(loadedAccounts);
      setTransactions(data.transactions || []);

      // Auto-select first real player if none selected
      const playerKeys = Object.keys(loadedAccounts).filter(k => k !== 'house_vault');
      if (playerKeys.length > 0 && !selectedPlayer) {
        setSelectedPlayer(playerKeys[0]);
      }
    } catch (err) {
      console.error("Failed to load cashier ledger:", err);
    }
  };

  useEffect(() => {
    refreshLedger();
  }, []);

  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setStatusMessage({ text: "Please enter a valid amount greater than $0.", error: true });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5050/api/admin/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer,
          amount: parsedAmount,
          method: paymentMethod
        })
      });

      const data = await res.json();

      if (data.success) {
        setStatusMessage({ text: data.message || `Successfully credited $${parsedAmount.toFixed(2)} to ${selectedPlayer}`, error: false });
        setDepositAmount(''); 
        refreshLedger(); 
        if (onTransactionSuccess) onTransactionSuccess();
      } else {
        setStatusMessage({ text: `Failed: ${data.message}`, error: true });
      }
    } catch (err) {
      setStatusMessage({ text: "Network error: Is backend running on port 5050?", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSweepProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const amt = parseFloat(sweepAmount);
    if (isNaN(amt) || amt <= 0) {
      setStatusMessage({ text: "Enter a valid sweep amount.", error: true });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5050/api/admin/sweep-profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          destination: destinationWallet
        })
      });

      const data = await res.json();

      if (data.success) {
        setStatusMessage({ text: data.message || `Swept $${amt.toFixed(2)} to treasury!`, error: false });
        setSweepAmount('');
        refreshLedger();
        if (onTransactionSuccess) onTransactionSuccess();
      } else {
        setStatusMessage({ text: `Sweep Failed: ${data.message}`, error: true });
      }
    } catch (err) {
      setStatusMessage({ text: "Network error during sweep execution.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const houseProfit = accounts['house_vault'] ? accounts['house_vault'].balance : 0;
  const playerKeys = Object.keys(accounts).filter(k => k !== 'house_vault');
  
  // KPI Calculations
  const totalPlayerBalances = playerKeys.reduce((sum, key) => sum + (accounts[key]?.balance || 0), 0);
  const totalDepositVolume = transactions
    .filter(tx => tx.amount > 0 && tx.playerId !== 'house_vault')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div style={{ fontFamily: 'monospace, system-ui', background: '#07080a', color: '#fff', padding: '2rem 1rem', minHeight: '90vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header Dashboard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1a1d26', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#00ffcc', margin: 0, fontSize: '1.8rem', letterSpacing: '1px' }}>💼 REVENUE & CASHIER DESK</h1>
            <p style={{ color: '#8892b0', fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>Cassanova Empire Master Vault & Player Settlement Hub</p>
          </div>
          <button 
            onClick={refreshLedger} 
            style={{ background: '#111317', border: '1px solid #00ffcc', color: '#00ffcc', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔄 REFRESH LEDGER
          </button>
        </div>

        {/* Metrics Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          
          <div style={{ background: '#0c0d12', border: '1px solid #2e7d32', padding: '1.2rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8c8c9e', textTransform: 'uppercase', display: 'block' }}>Unclaimed House Vault</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>${houseProfit.toFixed(2)}</span>
          </div>

          <div style={{ background: '#0c0d12', border: '1px solid #ff007f', padding: '1.2rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8c8c9e', textTransform: 'uppercase', display: 'block' }}>Total Deposit Volume</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff007f' }}>${totalDepositVolume.toFixed(2)}</span>
          </div>

          <div style={{ background: '#0c0d12', border: '1px solid #ffcc00', padding: '1.2rem', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8c8c9e', textTransform: 'uppercase', display: 'block' }}>Active Player Balances</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffcc00' }}>${totalPlayerBalances.toFixed(2)}</span>
          </div>

        </div>

        {/* Action Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Section A: Player Settlement */}
          <div style={{ background: '#0c0d12', padding: '1.5rem', borderRadius: '12px', border: '1px solid #222633' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#00ffcc', fontSize: '1.1rem' }}>💳 Credit Player Account</h3>
            <form onSubmit={handleExecuteSettlement}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem' }}>PLAYER ACCOUNT</label>
                {playerKeys.length > 0 ? (
                  <select 
                    value={selectedPlayer} 
                    onChange={(e) => setSelectedPlayer(e.target.value)} 
                    style={{ width: '100%', padding: '0.7rem', background: '#111317', border: '1px solid #222633', borderRadius: '6px', color: '#fff' }}
                  >
                    {playerKeys.map(key => (
                      <option key={key} value={key}>
                        {accounts[key].username || key} (Bal: ${accounts[key].balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={selectedPlayer} 
                    onChange={(e) => setSelectedPlayer(e.target.value)} 
                    placeholder="player_1"
                    required 
                    style={{ width: '100%', padding: '0.7rem', background: '#111317', border: '1px solid #222633', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} 
                  />
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem' }}>AMOUNT ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)} 
                  placeholder="100.00" 
                  required 
                  style={{ width: '100%', padding: '0.7rem', background: '#111317', border: '1px solid #222633', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem' }}>PAYMENT CHANNEL</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)} 
                  style={{ width: '100%', padding: '0.7rem', background: '#111317', border: '1px solid #222633', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="device_wallet_tap">📱 Apple / Google Pay</option>
                  <option value="direct_crypto">🔗 Direct Crypto Transfer (BTC/ETH)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                style={{ width: '100%', padding: '0.8rem', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'PROCESSING...' : '⚡ INJECT PLAYER CREDITS'}
              </button>
            </form>
          </div>

          {/* Section B: Sweep Profit to Business */}
          <div style={{ background: '#0c0d12', padding: '1.5rem', borderRadius: '12px', border: '1px solid #2e7d32' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#4caf50', fontSize: '1.1rem' }}>🏦 Sweep Vault Profit</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSweepAmount((houseProfit * 0.5).toFixed(2))} 
                  style={{ background: '#111317', border: '1px solid #2e7d32', color: '#4caf50', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  50%
                </button>
                <button 
                  type="button" 
                  onClick={() => setSweepAmount(houseProfit.toFixed(2))} 
                  style={{ background: '#111317', border: '1px solid #2e7d32', color: '#4caf50', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  MAX
                </button>
              </div>
            </div>

            <form onSubmit={handleSweepProfit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem' }}>SWEEP AMOUNT ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={sweepAmount} 
                  onChange={(e) => setSweepAmount(e.target.value)} 
                  placeholder={`Available: $${houseProfit.toFixed(2)}`} 
                  required 
                  style={{ width: '100%', padding: '0.7rem', background: '#111317', border: '1px solid #222633', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.3rem' }}>DESTINATION TREASURY WALLET</label>
                <input 
                  type="text" 
                  value={destinationWallet} 
                  onChange={(e) => setDestinationWallet(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.7rem', background: '#111317', border: '1px solid #222633', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || houseProfit <= 0} 
                style={{ width: '100%', padding: '0.8rem', background: houseProfit > 0 ? '#4caf50' : '#222633', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: houseProfit > 0 ? 'pointer' : 'not-allowed' }}
              >
                💸 SWEEP TO COLD TREASURY
              </button>
            </form>
          </div>

        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '6px', background: statusMessage.error ? '#2c1e1e' : '#1e2c1e', border: `1px solid ${statusMessage.error ? '#f44336' : '#4caf50'}`, color: statusMessage.error ? '#f44336' : '#4caf50' }}>
            {statusMessage.error ? '⚠️ ' : '✅ '} {statusMessage.text}
          </div>
        )}

        {/* Section C: Audit Logs */}
        <div style={{ background: '#0c0d12', padding: '1.5rem', borderRadius: '12px', border: '1px solid #222633' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#8892b0', fontSize: '1.1rem' }}>📜 Audit & Profit Transaction Log</h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222633', color: '#8892b0' }}>
                  <th style={{ padding: '0.6rem' }}>TIMESTAMP</th>
                  <th style={{ padding: '0.6rem' }}>ENTITY</th>
                  <th style={{ padding: '0.6rem' }}>ACTION</th>
                  <th style={{ padding: '0.6rem' }}>CHANNEL</th>
                  <th style={{ padding: '0.6rem' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#555' }}>No transactions recorded yet.</td>
                  </tr>
                ) : (
                  transactions.slice().reverse().map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #111317' }}>
                      <td style={{ padding: '0.6rem', color: '#8892b0' }}>{new Date(tx.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 'bold' }}>{tx.playerId}</td>
                      <td style={{ padding: '0.6rem', color: tx.playerId === 'house_vault' ? '#ff007f' : (tx.amount >= 0 ? '#4caf50' : '#f44336') }}>
                        {tx.playerId === 'house_vault' ? 'VAULT SWEEP' : (tx.amount >= 0 ? 'DEPOSIT' : 'GAME LOSS')}
                      </td>
                      <td style={{ padding: '0.6rem', color: '#ffcc00' }}>{(tx.method || 'SYSTEM').replace(/_/g, ' ').toUpperCase()}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 'bold', color: tx.amount >= 0 ? '#4caf50' : '#f44336' }}>
                        {tx.amount >= 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}