import React, { useState } from 'react';

// 1. Define the props structure coming down from App.tsx
interface AceEmpireSpinProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

interface SpinResponse {
  status: string;
  message: string;
  reels: string[];
  betAmount: number;
  winAmount: number;
  previousBalance: number;
  newBalance: number;
  username: string;
}

// 2. Consume the balance and setBalance props here
export default function AceEmpireSpin({ balance, setBalance }: AceEmpireSpinProps) {
  // --- Game Engine States ---
  const [reels, setReels] = useState<string[]>(['🍒', '🔔', '💎']);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [outcomeMessage, setOutcomeMessage] = useState<string>('CHOOSE YOUR BET & SPIN');
  const [winDisplay, setWinDisplay] = useState<number | null>(null);

  // --- Core Spin Activation Pipeline ---
  const handleSpin = async () => {
    if (isSpinning) return;
    
    // Optimistic calculation: immediately check if global balance is sufficient
    if (balance < betAmount) {
      setOutcomeMessage('❌ INSUFFICIENT GLOBAL REVENUE CREDITS. DEPOSIT AT CASHIER.');
      return;
    }
    
    setIsSpinning(true);
    setOutcomeMessage('💥 CONNECTING TO THE MATRIX... SPINNING...');
    setWinDisplay(null);

    try {
      const response = await fetch('http://localhost:5050/api/games/ace-empire-spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ betAmount })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Transmission array breakdown on spin loop.');
      }

      // 🎰 Step A: Run a rapid client side visual reel shuffle animation
      let cycles = 0;
      const animationSymbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '👑'];
      
      const interval = setInterval(() => {
        setReels([
          animationSymbols[Math.floor(Math.random() * animationSymbols.length)],
          animationSymbols[Math.floor(Math.random() * animationSymbols.length)],
          animationSymbols[Math.floor(Math.random() * animationSymbols.length)]
        ]);
        cycles++;
        
        // Step B: Once shuffle cycle ends, lock down the true server results
        if (cycles > 12) {
          clearInterval(interval);
          
          const result = data as SpinResponse;
          
          // GUARD RAIL: Only save the server reels if they exist, otherwise keep current items
          if (result && Array.isArray(result.reels)) {
            setReels(result.reels);
          } else {
            console.warn("⚠️ Server response is missing the 'reels' array:", result);
          }
          
          setOutcomeMessage(result.message || 'Spin completed.');
          setWinDisplay(result.winAmount !== undefined ? result.winAmount : 0);
          
          // 🚀 CRITICAL UPDATE: Pipe the new balance directly back into App.tsx mainframe!
          if (result.newBalance !== undefined) {
            setBalance(result.newBalance);
          }
          
          setIsSpinning(false);
        }
      }, 70);

    } catch (error: any) {
      setOutcomeMessage(`⚠️ CRITICAL REJECT: ${error.message}`);
      setIsSpinning(false);
      // Fallback to a valid state so map doesn't crash on subsequent ticks
      setReels(['🍒', '🔔', '💎']);
    }
  };

  return (
    <div style={{ backgroundColor: '#07080a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', padding: '1rem', color: '#fff' }}>
      <div style={{ background: '#111317', border: '3px solid #ff007f', boxShadow: '0 0 25px rgba(255, 0, 127, 0.4)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        
        {/* Header Block */}
        <h1 style={{ color: '#00ffcc', textShadow: '0 0 10px rgba(0,255,204,0.6)', margin: '0 0 0.5rem 0', fontSize: '2rem', letterSpacing: '1px' }}>🎰 ACE EMPIRE SPINS</h1>
        <p style={{ color: '#8892b0', margin: '0 0 2rem 0', fontSize: '0.9rem' }}>STATEFUL SERVER-VALIDATED SLOT MATRIX</p>

        {/* Display Panel */}
        <div style={{ background: '#07080a', border: '2px solid #33394d', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {(reels || ['🍒', '🔔', '💎']).map((symbol, idx) => (
            <div key={idx} style={{ background: '#1b1e26', border: '2px solid #ff007f', borderRadius: '8px', width: '90px', height: '90px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', transform: isSpinning ? 'scale(0.95)' : 'scale(1)', transition: 'all 0.1s ease', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)' }}>
              {symbol}
            </div>
          ))}
        </div>

        {/* Dynamic Matrix Ticker Logs */}
        <div style={{ background: '#1a1d24', borderLeft: '4px solid #00ffcc', padding: '0.8rem', borderRadius: '4px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#00ffcc', marginBottom: '2rem' }}>
          {outcomeMessage}
        </div>

        {/* Win / Balance Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#1b1e26', padding: '0.75rem', borderRadius: '6px', border: '1px solid #33394d' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.2rem' }}>LAST WIN payout</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: winDisplay && winDisplay > 0 ? '#00ffcc' : '#fff' }}>
              ${winDisplay !== null ? winDisplay : '0.00'}
            </span>
          </div>
          <div style={{ background: '#1b1e26', padding: '0.75rem', borderRadius: '6px', border: '1px solid #33394d' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: '0.2rem' }}>LIVE MATRIX WALLET</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ff007f' }}>
              {/* 🚀 CRITICAL UPDATE: Reading directly from global prop balance now! */}
              ${balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Configuration Controller & Spin Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#07080a', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #33394d' }}>
            <span style={{ color: '#8892b0', fontSize: '0.9rem' }}>SET SPIN COST:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button disabled={isSpinning} onClick={() => setBetAmount(p => Math.max(1, p - 5))} style={{ background: '#222633', border: 'none', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>-</button>
              <span style={{ fontWeight: 'bold', minWidth: '40px' }}>${betAmount}</span>
              <button disabled={isSpinning} onClick={() => setBetAmount(p => p + 5)} style={{ background: '#222633', border: 'none', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            style={{
              width: '100%',
              padding: '1.2rem',
              backgroundColor: isSpinning ? '#222633' : '#ff007f',
              boxShadow: isSpinning ? 'none' : '0 0 20px rgba(255, 0, 127, 0.4)',
              border: 'none',
              color: isSpinning ? '#8892b0' : '#fff',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              borderRadius: '8px',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.2s ease'
            }}
          >
            {isSpinning ? '🎰 CYCLING...' : '⚡ FIRE SPIN ENGINE'}
          </button>
        </div>

      </div>
    </div>
  );
}