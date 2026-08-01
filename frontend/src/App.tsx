import React, { useState, useEffect } from 'react';

// --- Interfaces ---
interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  weight: number;
}

interface Transaction {
  id: string;
  playerId: string;
  amount: number;
  type: string;
  method: string;
  destinationInfo?: string;
  timestamp: number;
}

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'casino' | 'cashier'>('casino');
  const [selectedGame, setSelectedGame] = useState<'slots' | 'mines' | 'blackjack' | 'roulette'>('roulette');

  // Local Persistent State
  const [activeBalance, setActiveBalance] = useState<number>(() => {
    const saved = localStorage.getItem('casanova_balance');
    return saved !== null ? parseFloat(saved) : 1000.00;
  });

  const [unclaimedVault, setUnclaimedVault] = useState<number>(() => {
    const saved = localStorage.getItem('casanova_vault');
    return saved !== null ? parseFloat(saved) : 250.00;
  });

  const [totalDepositVolume, setTotalDepositVolume] = useState<number>(() => {
    const saved = localStorage.getItem('casanova_volume');
    return saved !== null ? parseFloat(saved) : 250.00;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('casanova_txs');
    return saved !== null ? JSON.parse(saved) : [];
  });

  // Cashier Input State
  const [playerName, setPlayerName] = useState<string>('highroller_01');
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [paymentChannel, setPaymentChannel] = useState<string>('crypto_wallet');
  const [depositAccountInfo, setDepositAccountInfo] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Owner Sweep State
  const [vaultWithdrawAmount, setVaultWithdrawAmount] = useState<string>('100.00');
  const [payoutDestination, setPayoutDestination] = useState<string>('crypto_wallet');
  const [destinationInfo, setDestinationInfo] = useState<string>('');

  // Bet State
  const [betAmount, setBetAmount] = useState<number>(50);
  const [gameMessage, setGameMessage] = useState<string>('⚠️ ELITE HOUSE MODE: Maximum difficulty engaged. Play with caution.');

  // Blackjack State
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'ENDED'>('IDLE');

  // Mines State
  const [minesGrid, setMinesGrid] = useState<boolean[]>(Array(25).fill(false));
  const [revealedTiles, setRevealedTiles] = useState<boolean[]>(Array(25).fill(false));
  const [minesActive, setMinesActive] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);

  // Slots State
  const [reels, setReels] = useState<string[]>(['🎰', '🎰', '🎰', '🎰']);

  // Roulette State
  const [rouletteMessage, setRouletteMessage] = useState<string>('');
  const [lastLandedPocket, setLastLandedPocket] = useState<number | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('casanova_balance', activeBalance.toString());
    localStorage.setItem('casanova_vault', unclaimedVault.toString());
    localStorage.setItem('casanova_volume', totalDepositVolume.toString());
    localStorage.setItem('casanova_txs', JSON.stringify(transactions));
  }, [activeBalance, unclaimedVault, totalDepositVolume, transactions]);

  // --- CASHIER: DEPOSIT & VAULT UPDATE ---
  const handleInjectCredits = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setStatusMessage('❌ Enter a valid positive vault injection amount.');
      return;
    }

    if (!depositAccountInfo.trim()) {
      setStatusMessage('❌ Security Warning: Account number, email, or phone is required for deposit verification.');
      return;
    }

    const cleanPlayer = playerName.trim() !== '' ? playerName.trim() : 'guest_player';

    setActiveBalance((prev) => prev + amountNum);
    setUnclaimedVault((prev) => prev + amountNum);
    setTotalDepositVolume((prev) => prev + amountNum);

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      playerId: cleanPlayer,
      amount: amountNum,
      type: 'deposit',
      method: paymentChannel,
      destinationInfo: depositAccountInfo.trim(),
      timestamp: Date.now(),
    };
    setTransactions([newTx, ...transactions]);

    setStatusMessage(`⚡ [VAULT DEPOSIT] Credited $${amountNum.toFixed(2)} for ${cleanPlayer} via ${paymentChannel.toUpperCase()} (${depositAccountInfo.trim()}). Stakes elevated.`);
    setDepositAccountInfo('');
  };

  // --- OWNER VAULT PROFIT SWEEP ---
  const handleOwnerVaultSweep = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    const amountNum = parseFloat(vaultWithdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setStatusMessage('❌ Enter a valid profit sweep amount.');
      return;
    }

    if (amountNum > unclaimedVault) {
      setStatusMessage('❌ Error: Sweep exceeds available Unclaimed House Vault reserves.');
      return;
    }

    if (!destinationInfo.trim()) {
      setStatusMessage('❌ Security Warning: Destination recipient information required for clearance.');
      return;
    }

    setUnclaimedVault((prev) => prev - amountNum);
    setTotalDepositVolume((prev) => Math.max(0, prev - amountNum));

    const sweepTx: Transaction = {
      id: 'sweep_' + Date.now(),
      playerId: 'HOUSE_OWNER',
      amount: amountNum,
      type: 'owner_profit_sweep',
      method: payoutDestination,
      destinationInfo: destinationInfo.trim(),
      timestamp: Date.now(),
    };
    setTransactions([sweepTx, ...transactions]);

    setStatusMessage(`🏆 [VAULT SWEEP SUCCESS] $${amountNum.toFixed(2)} routed securely via ${payoutDestination.toUpperCase()} (${destinationInfo.trim()}).`);
    setDestinationInfo('');
  };

  // --- GAME ENGINES ---
  const drawCard = (): Card => {
    const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const val = values[Math.floor(Math.random() * values.length)];
    let weight = parseInt(val);
    if (['J', 'Q', 'K'].includes(val)) weight = 10;
    if (val === 'A') weight = 11;
    return { suit, value: val, weight };
  };

  const calculateHand = (hand: Card[]) => {
    let score = hand.reduce((acc, c) => acc + c.weight, 0);
    let aces = hand.filter((c) => c.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const startBlackjack = () => {
    if (activeBalance < betAmount) {
      setGameMessage('☠️ CRITICAL: Insufficient funds for table stake!');
      return;
    }
    setActiveBalance((prev) => prev - betAmount);

    const p1 = drawCard();
    const p2 = drawCard();
    const d1 = drawCard();
    const d2 = drawCard();

    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);
    setGameState('PLAYING');
    setGameMessage('⚔️ TABLE LIVE: Dealer holds the edge. Make your move.');
  };

  const hitBlackjack = () => {
    const newCard = drawCard();
    const newHand = [...playerCards, newCard];
    setPlayerCards(newHand);

    if (calculateHand(newHand) > 21) {
      setGameState('ENDED');
      setGameMessage('💀 TOTAL BUST! House absorbs your wager into the vault.');
      setUnclaimedVault((prev) => prev + betAmount);
    }
  };

  const standBlackjack = () => {
    let currentDealer = [...dealerCards];
    while (calculateHand(currentDealer) < 17) {
      currentDealer.push(drawCard());
    }
    setDealerCards(currentDealer);

    const pScore = calculateHand(playerCards);
    const dScore = calculateHand(currentDealer);

    setGameState('ENDED');

    if (dScore > 21 || pScore > dScore) {
      const winVal = betAmount * 1.9;
      setActiveBalance((prev) => prev + winVal);
      setGameMessage(`🔥 LEGENDARY WIN! You (${pScore}) beat Dealer (${dScore}). +$${winVal.toFixed(2)}`);
      setUnclaimedVault((prev) => Math.max(0, prev - betAmount));
    } else if (pScore === dScore) {
      setActiveBalance((prev) => prev + betAmount);
      setGameMessage(`🛡️ STALEMATE PUSH at ${pScore}. Stake returned.`);
    } else {
      setGameMessage(`💀 CRUSHED! Dealer total: ${dScore} vs Yours: ${pScore}. House claims stake.`);
      setUnclaimedVault((prev) => prev + betAmount);
    }
  };

  const startMines = () => {
    if (activeBalance < betAmount) {
      setGameMessage('☠️ Insufficient balance for Difficult Mines!');
      return;
    }
    setActiveBalance((prev) => prev - betAmount);

    const grid = Array(25).fill(false);
    let placed = 0;
    while (placed < 11) {
      const idx = Math.floor(Math.random() * 25);
      if (!grid[idx]) {
        grid[idx] = true;
        placed++;
      }
    }
    setMinesGrid(grid);
    setRevealedTiles(Array(25).fill(false));
    setMinesActive(true);
    setCurrentMultiplier(1.0);
    setGameMessage('⚠️ 11 MINES ARMED! Extreme hazard grid active.');
  };

  const clickTile = (idx: number) => {
    if (!minesActive || revealedTiles[idx]) return;

    if (minesGrid[idx]) {
      setRevealedTiles(Array(25).fill(true));
      setMinesActive(false);
      setGameMessage('💥 OBLITERATED! You triggered a hidden mine.');
      setUnclaimedVault((prev) => prev + betAmount);
    } else {
      const newRevealed = [...revealedTiles];
      newRevealed[idx] = true;
      setRevealedTiles(newRevealed);
      const nextMult = parseFloat((currentMultiplier + 0.85).toFixed(2));
      setCurrentMultiplier(nextMult);
      setGameMessage(`💎 Safe step! Multiplier boosted to ${nextMult}x`);
    }
  };

  const cashoutMines = () => {
    if (!minesActive) return;
    const winAmount = betAmount * currentMultiplier;
    setActiveBalance((prev) => prev + winAmount);
    setMinesActive(false);
    setRevealedTiles(Array(25).fill(true));
    setGameMessage(`🏆 SURVIVED & CASHED OUT! Collected $${winAmount.toFixed(2)} (${currentMultiplier}x)`);
    setUnclaimedVault((prev) => Math.max(0, prev - (winAmount - betAmount)));
  };

  const spinSlots = () => {
    if (activeBalance < betAmount) {
      setGameMessage('☠️ Insufficient balance!');
      return;
    }
    setActiveBalance((prev) => prev - betAmount);

    const symbols = ['💎', '7️⃣', '⚡', '🔥', '💀', '👑', '⭐'];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];
    const s4 = symbols[Math.floor(Math.random() * symbols.length)];

    setReels([s1, s2, s3, s4]);

    if (s1 === s2 && s2 === s3 && s3 === s4) {
      const payout = betAmount * 50;
      setActiveBalance((prev) => prev + payout);
      setGameMessage(`⚡ QUADRUPLE JACKPOT! ALL 4 MATCHED! +$${payout.toFixed(2)} (50x)`);
      setUnclaimedVault((prev) => Math.max(0, prev - (payout - betAmount)));
    } else if (s1 === s2 && s2 === s3) {
      const payout = betAmount * 5;
      setActiveBalance((prev) => prev + payout);
      setGameMessage(`✨ Triple match consolation! +$${payout.toFixed(2)} (5x)`);
      setUnclaimedVault((prev) => Math.max(0, prev - (payout - betAmount)));
    } else {
      setGameMessage('💀 Dry spin on the 4-reel layout. House retains wager.');
      setUnclaimedVault((prev) => prev + betAmount);
    }
  };

  // --- HARD ROULETTE (38 pockets: 0-36 plus 37 as 00) ---
  const playRoulette = (betType: 'RED' | 'BLACK' | 'ODD' | 'EVEN' | 'SINGLE_ZERO' | number) => {
    if (activeBalance < betAmount) {
      setGameMessage('☠️ Insufficient balance!');
      return;
    }
    setActiveBalance((prev) => prev - betAmount);

    const landNumber = Math.floor(Math.random() * 38);
    setLastLandedPocket(landNumber);

    const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(landNumber);
    const isEven = landNumber !== 0 && landNumber !== 37 && landNumber % 2 === 0;

    let win = false;
    let multiplier = 2;

    if (typeof betType === 'number') {
      if (landNumber === betType) {
        win = true;
        multiplier = 35;
      }
    } else {
      if (betType === 'RED' && isRed) win = true;
      if (betType === 'BLACK' && !isRed && landNumber !== 0 && landNumber !== 37) win = true;
      if (betType === 'EVEN' && isEven) win = true;
      if (betType === 'ODD' && !isEven && landNumber !== 0 && landNumber !== 37) win = true;
      if (betType === 'SINGLE_ZERO' && (landNumber === 0 || landNumber === 37)) {
        win = true;
        multiplier = 18;
      }
    }

    const displayNum = landNumber === 37 ? '00' : landNumber;
    const landColor = (landNumber === 0 || landNumber === 37) ? `ZERO HOUSE POCKET 🟢 (${displayNum})` : isRed ? 'RED 🔴' : 'BLACK 🖤';

    if (win) {
      const winAmount = betAmount * multiplier;
      setActiveBalance((prev) => prev + winAmount);
      setRouletteMessage(`🎯 Ball landed on ${displayNum} (${landColor})! 🏆 WIN +$${winAmount.toFixed(2)}`);
      setUnclaimedVault((prev) => Math.max(0, prev - betAmount));
    } else {
      setRouletteMessage(`💀 Ball landed on ${displayNum} (${landColor}). House sweeps stake.`);
      setUnclaimedVault((prev) => prev + betAmount);
    }
  };

  const getDepositAccountPlaceholder = () => {
    switch (paymentChannel) {
      case 'wire_transfer':
        return 'Enter Bank Account / Routing Number';
      case 'apple_pay':
        return 'Enter Apple Pay Phone or Email';
      case 'google_pay':
        return 'Enter Google Pay Email or Phone';
      case 'crypto_wallet':
        return 'Enter Crypto Wallet Address (BTC/ETH/USDT)';
      default:
        return 'Enter account #, email, or phone...';
    }
  };

  const getDestinationPlaceholder = () => {
    switch (payoutDestination) {
      case 'personal_bank':
        return 'Enter Routing & Account #';
      case 'apple_pay':
        return 'Enter Apple Pay Phone or Email';
      case 'google_pay':
        return 'Enter Google Pay Email or Phone';
      case 'crypto_wallet':
        return 'Enter Secure Crypto Wallet Address';
      default:
        return 'Enter destination credentials...';
    }
  };

  const isPocketRed = (num: number) => {
    return [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
  };

  return (
    <div style={{ background: '#050505', color: '#facc15', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 36px', background: '#000000', borderBottom: '2px solid #eab308' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px', filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' }}>⚡</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#facc15', letterSpacing: '1.5px', textShadow: '0 0 12px rgba(250, 204, 21, 0.4)' }}>
                CASANOVA
              </h1>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '8px', background: '#0f0f11', padding: '4px', borderRadius: '10px', border: '1px solid #3f3f46' }}>
            <button 
              onClick={() => setActiveTab('casino')}
              style={{ background: activeTab === 'casino' ? '#facc15' : 'transparent', color: activeTab === 'casino' ? '#000000' : '#a1a1aa', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              🎰 CASINO FLOOR
            </button>
            <button 
              onClick={() => setActiveTab('cashier')}
              style={{ background: activeTab === 'cashier' ? '#facc15' : 'transparent', color: activeTab === 'cashier' ? '#000000' : '#a1a1aa', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              💳 HIGHROLLER TREASURY
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#0f0f11', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: '1px solid #3f3f46', color: '#a1a1aa' }}>
            OPERATOR: <strong style={{ color: '#facc15' }}>{playerName}</strong>
          </div>
          <div style={{ background: '#000000', color: '#facc15', padding: '8px 20px', borderRadius: '20px', fontWeight: '900', fontSize: '16px', border: '2px solid #facc15', boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}>
            ${activeBalance.toFixed(2)}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>
        
        {activeTab === 'casino' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
              {[
                { id: 'blackjack', name: '🃏 BLACKJACK', desc: 'Dealer hits soft 17' },
                { id: 'mines', name: '💣 11-BOMB MINES', desc: 'Brutal hazard grid' },
                { id: 'slots', name: '🎰 4-REEL SLOTS', desc: '50x Quadruple Jackpots' },
                { id: 'roulette', name: '🎡 ELITE ROULETTE', desc: '38-pocket double zero' },
              ].map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game.id as any);
                    setGameMessage('⚠️ High-difficulty table active. Place your wager.');
                  }}
                  style={{
                    padding: '16px',
                    background: selectedGame === game.id ? '#18181b' : '#0a0a0c',
                    border: selectedGame === game.id ? '2px solid #facc15' : '1px solid #27272a',
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: selectedGame === game.id ? '0 0 20px rgba(250, 204, 21, 0.2)' : 'none',
                  }}
                >
                  <div style={{ fontWeight: '900', fontSize: '15px', color: selectedGame === game.id ? '#facc15' : '#f4f4f5' }}>{game.name}</div>
                  <small style={{ color: '#71717a', fontSize: '12px' }}>{game.desc}</small>
                </button>
              ))}
            </div>

            <div style={{ background: '#0e0e11', borderRadius: '16px', border: '1px solid #27272a', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
              
              {gameMessage && (
                <div style={{ background: '#000000', borderLeft: '4px solid #ef4444', padding: '14px 20px', borderRadius: '8px', marginBottom: '24px', fontWeight: '900', color: '#facc15', textAlign: 'center', border: '1px solid #27272a' }}>
                  {gameMessage}
                </div>
              )}

              {/* Blackjack */}
              {selectedGame === 'blackjack' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: '#000000', padding: '28px', borderRadius: '12px', border: '1px solid #27272a', minHeight: '260px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 16px', color: '#ef4444' }}>
                        DEALER HAND {gameState === 'ENDED' && `(${calculateHand(dealerCards)})`}
                      </h4>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {dealerCards.map((card, i) => (
                          <div key={i} style={{ width: '70px', height: '100px', background: '#f4f4f5', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px', color: ['♥', '♦'].includes(card.suit) ? '#dc2626' : '#000', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.7)' }}>
                            <div>{card.value}</div>
                            <div style={{ textAlign: 'right', fontSize: '22px' }}>{card.suit}</div>
                          </div>
                        ))}
                        {dealerCards.length === 0 && <span style={{ color: '#52525b' }}>Press Deal to Engage</span>}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 16px', color: '#facc15' }}>
                        YOUR HAND {playerCards.length > 0 && `(${calculateHand(playerCards)})`}
                      </h4>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {playerCards.map((card, i) => (
                          <div key={i} style={{ width: '70px', height: '100px', background: '#f4f4f5', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px', color: ['♥', '♦'].includes(card.suit) ? '#dc2626' : '#000', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.7)' }}>
                            <div>{card.value}</div>
                            <div style={{ textAlign: 'right', fontSize: '22px' }}>{card.suit}</div>
                          </div>
                        ))}
                        {playerCards.length === 0 && <span style={{ color: '#52525b' }}>Press Deal to Engage</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                    {gameState !== 'PLAYING' ? (
                      <button onClick={startBlackjack} style={{ background: '#facc15', color: '#000000', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '16px', boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}>
                        ⚔️ DEAL HAND (${betAmount})
                      </button>
                    ) : (
                      <>
                        <button onClick={hitBlackjack} style={{ background: '#facc15', color: '#000000', border: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
                          ➕ HIT
                        </button>
                        <button onClick={standBlackjack} style={{ background: '#27272a', color: '#facc15', border: '1px solid #facc15', padding: '14px 28px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
                          ✋ STAND
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Mines */}
              {selectedGame === 'mines' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '380px', margin: '0 auto 24px' }}>
                    {minesGrid.map((isBomb, idx) => (
                      <button
                        key={idx}
                        onClick={() => clickTile(idx)}
                        disabled={!minesActive || revealedTiles[idx]}
                        style={{
                          width: '65px',
                          height: '65px',
                          borderRadius: '10px',
                          border: '1px solid #3f3f46',
                          background: revealedTiles[idx] ? (isBomb ? '#7f1d1d' : '#000000') : '#18181b',
                          fontSize: '24px',
                          cursor: minesActive && !revealedTiles[idx] ? 'pointer' : 'default',
                          color: '#facc15',
                        }}
                      >
                        {revealedTiles[idx] ? (isBomb ? '💣' : '💎') : ''}
                      </button>
                    ))}
                  </div>

                  {!minesActive ? (
                    <button onClick={startMines} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}>
                      💣 START 11-BOMB MINES (${betAmount})
                    </button>
                  ) : (
                    <button onClick={cashoutMines} style={{ background: '#facc15', color: '#000000', border: 'none', padding: '14px 32px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
                      🏆 BAIL & CASHOUT (${(betAmount * currentMultiplier).toFixed(2)})
                    </button>
                  )}
                </div>
              )}

              {/* Slots */}
              {selectedGame === 'slots' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', background: '#000000', padding: '36px', borderRadius: '16px', border: '2px solid #ef4444', maxWidth: '480px', margin: '0 auto 24px', boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)' }}>
                    {reels.map((symbol, i) => (
                      <div key={i} style={{ width: '80px', height: '95px', background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', border: '1px solid #3f3f46' }}>
                        {symbol}
                      </div>
                    ))}
                  </div>

                  <button onClick={spinSlots} style={{ background: '#facc15', color: '#000000', border: 'none', padding: '16px 40px', borderRadius: '10px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}>
                    🎰 SPIN 4-REEL SLOTS (${betAmount})
                  </button>
                </div>
              )}

              {/* Elite Roulette with Full Table Board */}
              {selectedGame === 'roulette' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: '#000000', padding: '20px', borderRadius: '16px', border: '1px solid #27272a', maxWidth: '720px', margin: '0 auto 20px' }}>
                    <p style={{ color: '#71717a', margin: '0 0 10px', fontSize: '13px', fontWeight: 'bold' }}>
                      ELITE ROULETTE: 38 POCKETS INCLUDING SINGLE & DOUBLE ZERO HOUSE EDGE
                    </p>
                    {rouletteMessage && (
                      <div style={{ color: '#facc15', fontWeight: 'bold', fontSize: '14px', background: '#18181b', padding: '10px', borderRadius: '6px', border: '1px solid #3f3f46', marginBottom: '16px' }}>
                        {rouletteMessage}
                      </div>
                    )}

                    {/* Roulette Grid Table Board */}
                    <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', gap: '4px', background: '#09090b', padding: '12px', borderRadius: '10px', border: '1px solid #3f3f46', overflowX: 'auto' }}>
                      
                      {/* Zero and Double Zero Column */}
                      <div style={{ gridRow: 'span 3', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button 
                          onClick={() => playRoulette(0)}
                          style={{ flex: 1, background: '#10b981', color: '#000', border: 'none', borderRadius: '4px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', minHeight: '36px', outline: lastLandedPocket === 0 ? '2px solid #fff' : 'none' }}
                        >
                          0
                        </button>
                        <button 
                          onClick={() => playRoulette(37)}
                          style={{ flex: 1, background: '#059669', color: '#000', border: 'none', borderRadius: '4px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', minHeight: '36px', outline: lastLandedPocket === 37 ? '2px solid #fff' : 'none' }}
                        >
                          00
                        </button>
                      </div>

                      {/* Number Grid 1 to 36 */}
                      {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => {
                        const red = isPocketRed(num);
                        return (
                          <button
                            key={num}
                            onClick={() => playRoulette(num)}
                            style={{
                              background: red ? '#dc2626' : '#18181b',
                              color: '#fff',
                              border: '1px solid #3f3f46',
                              borderRadius: '4px',
                              padding: '10px 4px',
                              fontSize: '13px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              outline: lastLandedPocket === num ? '2px solid #fff' : 'none'
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    {/* Outside Bet Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '16px' }}>
                      <button onClick={() => playRoulette('RED')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '12px 8px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>
                        🔴 RED (2X)
                      </button>
                      <button onClick={() => playRoulette('BLACK')} style={{ background: '#18181b', color: '#facc15', border: '1px solid #3f3f46', padding: '12px 8px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>
                        🖤 BLACK (2X)
                      </button>
                      <button onClick={() => playRoulette('SINGLE_ZERO')} style={{ background: '#10b981', color: '#000', border: 'none', padding: '12px 8px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>
                        🟢 ZERO / 00 (18X)
                      </button>
                      <button onClick={() => playRoulette('EVEN')} style={{ background: '#18181b', color: '#facc15', border: '1px solid #3f3f46', padding: '12px 8px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>
                        2️⃣ EVEN (2X)
                      </button>
                      <button onClick={() => playRoulette('ODD')} style={{ background: '#18181b', color: '#facc15', border: '1px solid #3f3f46', padding: '12px 8px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '13px' }}>
                        1️⃣ ODD (2X)
                      </button>
                    </div>

                  </div>
                </div>
              )}

              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: '#71717a', fontWeight: 'bold', fontSize: '14px' }}>TABLE WAGER:</span>
                {[25, 50, 100, 250, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBetAmount(val)}
                    style={{
                      background: betAmount === val ? '#facc15' : '#18181b',
                      color: betAmount === val ? '#000000' : '#facc15',
                      border: '1px solid #3f3f46',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    ${val}
                  </button>
                ))}
              </div>

            </div>
          </div>
        ) : (
          /* Cashier & Ledger Tab */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#facc15' }}>HIGHROLLER TREASURY & OWNER VAULT</h2>
                <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: '14px' }}>Instant vault injections and automated profit sweeps</p>
              </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
              <div style={{ background: '#0e0e11', padding: '20px', borderRadius: '12px', border: '1px solid #27272a', borderLeft: '4px solid #facc15' }}>
                <small style={{ color: '#71717a', fontWeight: 'bold' }}>UNCLAIMED HOUSE VAULT</small>
                <h2 style={{ margin: '8px 0 0', color: '#facc15' }}>${unclaimedVault.toFixed(2)}</h2>
              </div>
              <div style={{ background: '#0e0e11', padding: '20px', borderRadius: '12px', border: '1px solid #27272a', borderLeft: '4px solid #facc15' }}>
                <small style={{ color: '#71717a', fontWeight: 'bold' }}>TOTAL DEPOSIT VOLUME</small>
                <h2 style={{ margin: '8px 0 0', color: '#facc15' }}>${totalDepositVolume.toFixed(2)}</h2>
              </div>
              <div style={{ background: '#0e0e11', padding: '20px', borderRadius: '12px', border: '1px solid #27272a', borderLeft: '4px solid #facc15' }}>
                <small style={{ color: '#71717a', fontWeight: 'bold' }}>ACTIVE BALANCE</small>
                <h2 style={{ margin: '8px 0 0', color: '#facc15' }}>${activeBalance.toFixed(2)}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
              
              {statusMessage && (
                <div style={{ padding: '14px', borderRadius: '8px', fontSize: '14px', background: '#000000', color: '#facc15', fontWeight: 'bold', border: '1px solid #facc15' }}>
                  {statusMessage}
                </div>
              )}

              {/* Credit Player Account */}
              <div style={{ background: '#0e0e11', padding: '28px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#facc15' }}>💳 Credit Highroller Account</h3>

                <form onSubmit={handleInjectCredits} style={{ display: 'grid', gap: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                        OPERATOR ALIAS
                      </label>
                      <input 
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                        DEPOSIT AMOUNT ($)
                      </label>
                      <input 
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                        PAYMENT CHANNEL
                      </label>
                      <select 
                        value={paymentChannel}
                        onChange={(e) => {
                          setPaymentChannel(e.target.value);
                          setDepositAccountInfo('');
                        }}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none' }}
                      >
                        <option value="crypto_wallet">🔗 Secure Crypto Transfer (BTC/ETH/USDT)</option>
                        <option value="apple_pay">🍏 Apple Pay / Google Pay</option>
                        <option value="wire_transfer">🏦 Direct Wire Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                        ACCOUNT #, EMAIL, OR PHONE
                      </label>
                      <input 
                        type="text"
                        value={depositAccountInfo}
                        onChange={(e) => setDepositAccountInfo(e.target.value)}
                        placeholder={getDepositAccountPlaceholder()}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    style={{ background: '#facc15', color: '#000000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)' }}
                  >
                    ⚡ INJECT CREDITS
                  </button>
                </form>
              </div>

              {/* Owner Vault Profit Sweep */}
              <div style={{ background: '#0e0e11', padding: '28px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#facc15' }}>🏛️ Owner Vault Profit Sweep</h3>
                
                <form onSubmit={handleOwnerVaultSweep} style={{ display: 'grid', gap: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                        SWEEP AMOUNT ($)
                      </label>
                      <input 
                        type="number"
                        value={vaultWithdrawAmount}
                        onChange={(e) => setVaultWithdrawAmount(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                        DESTINATION OPTION
                      </label>
                      <select 
                        value={payoutDestination}
                        onChange={(e) => {
                          setPayoutDestination(e.target.value);
                          setDestinationInfo('');
                        }}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none' }}
                      >
                        <option value="personal_bank">🏦 Personal Bank</option>
                        <option value="apple_pay">🍏 Apple Pay</option>
                        <option value="google_pay">🤖 Google Pay</option>
                        <option value="crypto_wallet">🔗 Crypto Wallet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: '#71717a', fontSize: '12px', fontWeight: '900' }}>
                      RECIPIENT INFORMATION (REQUIRED)
                    </label>
                    <input 
                      type="text"
                      value={destinationInfo}
                      onChange={(e) => setDestinationInfo(e.target.value)}
                      placeholder={getDestinationPlaceholder()}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#000000', color: '#facc15', border: '1px solid #3f3f46', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    style={{ background: '#facc15', color: '#000000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)' }}
                  >
                    💸 EXECUTE PROFIT SWEEP
                  </button>
                </form>
              </div>

              {/* Transaction Audit Ledger */}
              <div style={{ background: '#0e0e11', padding: '28px', borderRadius: '16px', border: '1px solid #27272a' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#facc15' }}>📜 Immutable Audit Ledger</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #3f3f46', color: '#71717a' }}>
                        <th style={{ padding: '12px' }}>TIMESTAMP</th>
                        <th style={{ padding: '12px' }}>ENTITY</th>
                        <th style={{ padding: '12px' }}>TYPE</th>
                        <th style={{ padding: '12px' }}>CHANNEL & ACCOUNT/DESTINATION DETAILS</th>
                        <th style={{ padding: '12px' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#52525b' }}>
                            No vault transactions logged yet.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #27272a' }}>
                            <td style={{ padding: '12px', color: '#71717a' }}>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: tx.playerId === 'HOUSE_OWNER' ? '#facc15' : '#f4f4f5' }}>
                              {tx.playerId}
                            </td>
                            <td style={{ padding: '12px', textTransform: 'capitalize', color: '#a1a1aa' }}>{tx.type}</td>
                            <td style={{ padding: '12px', color: '#a1a1aa' }}>
                              <strong style={{ textTransform: 'uppercase', color: '#facc15' }}>{tx.method}</strong>
                              {tx.destinationInfo && <div style={{ fontSize: '12px', color: '#71717a' }}>{tx.destinationInfo}</div>}
                            </td>
                            <td style={{ padding: '12px', fontWeight: '900', color: tx.playerId === 'HOUSE_OWNER' ? '#ef4444' : '#facc15' }}>
                              {tx.playerId === 'HOUSE_OWNER' ? `-$${tx.amount.toFixed(2)}` : `+$${tx.amount.toFixed(2)}`}
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
        )}

      </main>
    </div>
  );
}

export default App;