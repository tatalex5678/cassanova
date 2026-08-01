import React, { useState } from 'react';

interface Card {
  value: string;
  suit: string;
}

interface BlackjackProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

export default function CyberBlackjack({ balance, setBalance }: BlackjackProps) {
  const [bet, setBet] = useState<number>(100);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<string>('idle');
  const [logMessage, setLogMessage] = useState<string>('MAINFRAME READY: Balance linked to master grid profile.');
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);

  const handleGameAction = async (actionType: 'deal' | 'hit' | 'stand') => {
    try {
      const response = await fetch('http://localhost:5050/api/games/blackjack-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: bet,
          action: actionType,
          playerHand: actionType === 'deal' ? null : playerHand,
          dealerHand: actionType === 'deal' ? null : dealerHand,
          deck: actionType === 'deal' ? null : currentDeck
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setLogMessage(data.message);
        return;
      }

      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      setGameStatus(data.status);
      setLogMessage(data.message);
      setCurrentDeck(data.deck);
      
      setBalance(data.newBalance);

    } catch (err) {
      setLogMessage('❌ CORRUPT SIGNAL: Could not connect to processing cluster.');
    }
  };

  return (
    <div style={{ backgroundColor: '#07080a', minHeight: '90vh', padding: '2rem', fontFamily: 'monospace', color: '#fff' }}>
      
      {/* HUD Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #222633', background: '#111317', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <div><span style={{ color: '#8892b0' }}>SYS_WALLET:</span> <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>${balance}</span></div>
        <div><span style={{ color: '#8892b0' }}>HOUSE_RULES:</span> <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>BLACKJACK PAY 6:5 | DEALER HITS SOFT 17</span></div>
        <div><span style={{ color: '#8892b0' }}>GAME:</span> <span style={{ color: '#ff007f', fontWeight: 'bold' }}>CYBER_BLACKJACK_V1</span></div>
      </div>

      {/* Main Board Arena */}
      <div style={{ border: '2px solid #ff007f', borderRadius: '12px', background: '#0c0d12', padding: '2rem', position: 'relative', boxShadow: '0 0 20px rgba(255,0,127,0.05)' }}>
        
        {/* DEALER FIELD */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ color: '#8892b0', margin: '0 0 1rem 0' }}>🤖 DECRYPTED MAINFRAME HAND (Score: {gameStatus === 'playing' ? '?' : dealerScore})</h3>
          <div style={{ display: 'flex', gap: '1rem', minHeight: '120px' }}>
            {dealerHand.map((card, idx) => (
              <div key={idx} style={{ background: '#111317', border: '2px solid #00ffcc', borderRadius: '8px', width: '80px', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.5rem', boxSizing: 'border-box', boxShadow: '0 0 10px rgba(0,255,204,0.1)' }}>
                {idx === 1 && gameStatus === 'playing' ? (
                  <div style={{ color: '#ff007f', margin: 'auto', fontWeight: 'bold' }}>[X]</div>
                ) : (
                  <>
                    <div style={{ color: ['♥','♦'].includes(card.suit) ? '#ff007f' : '#00ffcc' }}>{card.value}</div>
                    <div style={{ fontSize: '2rem', textAlign: 'center', color: ['♥','♦'].includes(card.suit) ? '#ff007f' : '#00ffcc' }}>{card.suit}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER FIELD */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#00ffcc', margin: '0 0 1rem 0' }}>⚡ PLAYER ALLOCATION ARRAY (Score: {playerScore})</h3>
          <div style={{ display: 'flex', gap: '1rem', minHeight: '120px' }}>
            {playerHand.map((card, idx) => (
              <div key={idx} style={{ background: '#111317', border: '2px solid #ff007f', borderRadius: '8px', width: '80px', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.5rem', boxSizing: 'border-box', boxShadow: '0 0 10px rgba(255,0,127,0.1)' }}>
                <div style={{ color: ['♥','♦'].includes(card.suit) ? '#ff007f' : '#00ffcc' }}>{card.value}</div>
                <div style={{ fontSize: '2rem', textAlign: 'center', color: ['♥','♦'].includes(card.suit) ? '#ff007f' : '#00ffcc' }}>{card.suit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LOG OUTLINE METRICS */}
        <div style={{ background: '#111317', borderLeft: '3px solid #00ffcc', padding: '0.8rem', color: '#8892b0', borderRadius: '4px', marginBottom: '2rem' }}>
          {logMessage}
        </div>

        {/* GAME ACTIONS CONTROL PANEL */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {gameStatus === 'idle' || !['playing'].includes(gameStatus) ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.2rem' }}>BET CORES</label>
                <input type="number" value={bet} onChange={(e) => setBet(Number(e.target.value))} style={{ background: '#111317', border: '1px solid #222633', color: '#00ffcc', padding: '0.5rem', width: '100px', borderRadius: '4px', outline: 'none' }} />
              </div>
              <button onClick={() => handleGameAction('deal')} style={{ background: '#ff007f', color: '#fff', border: 'none', padding: '0.8rem 2rem', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', marginTop: '1rem' }}>⚡ INJECT SIGNAL (DEAL)</button>
            </>
          ) : (
            <>
              <button onClick={() => handleGameAction('hit')} style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '0.8rem 2rem', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>➕ HIT STACK</button>
              <button onClick={() => handleGameAction('stand')} style={{ background: '#222633', color: '#fff', border: '1px solid #ff007f', padding: '0.8rem 2rem', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>🛑 STAND TRANSMISSION</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}