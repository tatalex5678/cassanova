import React, { useState } from 'react';

interface MinesProps {
  playerId?: string;
  apiBaseUrl?: string;
  onBalanceChange?: (newBalance: number) => void;
}

export const Mines: React.FC<MinesProps> = ({
  playerId = 'player_1',
  apiBaseUrl = 'http://localhost:5050',
  onBalanceChange,
}) => {
  // Config state
  const [betAmount, setBetAmount] = useState<number>(10);
  const [mineCount, setMineCount] = useState<number>(3);

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [hitTile, setHitTile] = useState<number | null>(null);

  // Status & Stats state
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [nextPayout, setNextPayout] = useState<string>('0.00');
  const [message, setMessage] = useState<string>('Select your bet and mine count to start!');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Start a new game session
  const handleStartGame = async () => {
    if (betAmount <= 0) {
      setMessage('Please enter a valid bet amount.');
      return;
    }

    setIsLoading(true);
    setMessage('Starting game...');

    try {
      const res = await fetch(`${apiBaseUrl}/api/games/mines/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, betAmount, mineCount }),
      });

      const data = await res.json();

      if (data.success) {
        setIsPlaying(true);
        setRevealedTiles([]);
        setMinePositions([]);
        setHitTile(null);
        setCurrentMultiplier(1.0);
        setNextPayout('0.00');
        setMessage(data.message || 'Game started! Tap a tile to reveal a gem.');

        if (onBalanceChange && data.newBalance !== undefined) {
          onBalanceChange(data.newBalance);
        }
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Click tile to reveal safe gem or hit mine
  const handleTileClick = async (tileIndex: number) => {
    if (!isPlaying || revealedTiles.includes(tileIndex) || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/games/mines/tile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, tileIndex }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message);
        setIsLoading(false);
        return;
      }

      // Hit a mine
      if (data.hitMine) {
        setIsPlaying(false);
        setHitTile(tileIndex);
        setMinePositions(data.minePositions || []);
        setMessage(data.message || '💥 BOOM! You hit a mine!');

        if (onBalanceChange && data.newBalance !== undefined) {
          onBalanceChange(data.newBalance);
        }
      }
      // Perfect clear
      else if (data.cleared) {
        setIsPlaying(false);
        setRevealedTiles((prev) => [...prev, tileIndex]);
        setMinePositions(data.minePositions || []);
        setCurrentMultiplier(data.multiplier);
        setMessage(data.message || '🎉 PERFECT CLEAR!');

        if (onBalanceChange && data.newBalance !== undefined) {
          onBalanceChange(data.newBalance);
        }
      }
      // Safe gem revealed
      else {
        setRevealedTiles((prev) => [...prev, tileIndex]);
        setCurrentMultiplier(data.currentMultiplier);
        setNextPayout(data.nextPayout);
        setMessage(`💎 Safe! Current Multiplier: ${data.currentMultiplier}x`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error revealing tile.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Cash out collected profit
  const handleCashout = async () => {
    if (!isPlaying || revealedTiles.length === 0 || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/games/mines/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      const data = await res.json();

      if (data.success) {
        setIsPlaying(false);
        setMinePositions(data.minePositions || []);
        setMessage(data.message || `💰 Cashed out $${data.payout.toFixed(2)}!`);

        if (onBalanceChange && data.newBalance !== undefined) {
          onBalanceChange(data.newBalance);
        }
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage('Cashout error.');
    } finally {
      setIsLoading(false);
    }
  };

  const potentialPayout = (betAmount * currentMultiplier).toFixed(2);

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.header}>
        <h2 style={styles.title}>💣 CASANOVA MINES</h2>
        <div style={styles.statusBox}>{message}</div>
      </div>

      <div style={styles.gameArea}>
        {/* Controls Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Bet Amount ($)</label>
            <input
              type="number"
              min="1"
              disabled={isPlaying}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mines Count (1 - 24)</label>
            <select
              disabled={isPlaying}
              value={mineCount}
              onChange={(e) => setMineCount(parseInt(e.target.value))}
              style={styles.select}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Mine' : 'Mines'}
                </option>
              ))}
            </select>
          </div>

          {isPlaying && (
            <div style={styles.statsCard}>
              <div style={styles.statRow}>
                <span>Multiplier:</span>
                <strong>{currentMultiplier}x</strong>
              </div>
              <div style={styles.statRow}>
                <span>Current Value:</span>
                <strong style={{ color: '#4ade80' }}>${potentialPayout}</strong>
              </div>
            </div>
          )}

          {!isPlaying ? (
            <button
              onClick={handleStartGame}
              disabled={isLoading}
              style={{ ...styles.actionBtn, backgroundColor: '#22c55e' }}
            >
              {isLoading ? 'Starting...' : 'BET & START'}
            </button>
          ) : (
            <button
              onClick={handleCashout}
              disabled={isLoading || revealedTiles.length === 0}
              style={{
                ...styles.actionBtn,
                backgroundColor: revealedTiles.length > 0 ? '#eab308' : '#475569',
                cursor: revealedTiles.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              {isLoading ? 'Cashing Out...' : `CASH OUT ($${potentialPayout})`}
            </button>
          )}
        </div>

        {/* 5x5 Mines Grid */}
        <div style={styles.grid}>
          {Array.from({ length: 25 }, (_, idx) => {
            const isRevealed = revealedTiles.includes(idx);
            const isMine = minePositions.includes(idx);
            const isHit = hitTile === idx;

            let tileContent = '';
            let tileBg = '#1e293b';

            if (isRevealed) {
              tileContent = '💎';
              tileBg = '#065f46';
            } else if (isHit) {
              tileContent = '💥';
              tileBg = '#991b1b';
            } else if (isMine) {
              tileContent = '💣';
              tileBg = '#7f1d1d';
            }

            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                disabled={!isPlaying || isRevealed || isLoading}
                style={{
                  ...styles.tile,
                  backgroundColor: tileBg,
                  cursor: isPlaying && !isRevealed ? 'pointer' : 'default',
                }}
              >
                {tileContent}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Inline Layout & Styling
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: '24px',
    borderRadius: '16px',
    fontFamily: 'sans-serif',
    maxWidth: '800px',
    margin: '0 auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    letterSpacing: '1px',
    margin: '0 0 10px 0',
    color: '#f59e0b',
  },
  statusBox: {
    backgroundColor: '#1e293b',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #334155',
    minHeight: '20px',
  },
  gameArea: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  sidebar: {
    flex: '1 1 240px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
  },
  select: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
  },
  statsCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  actionBtn: {
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '16px',
    letterSpacing: '0.5px',
    transition: 'opacity 0.2s',
  },
  grid: {
    flex: '2 1 320px',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    aspectRatio: '1',
  },
  tile: {
    aspectRatio: '1',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    transition: 'transform 0.1s, background-color 0.2s',
  },
};