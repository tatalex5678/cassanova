import { useState, useEffect } from 'react';

interface GameCard {
  title: string;
  slug: 'home' | 'slots' | 'blackjack' | 'cashier'; // Aligned directly with your App.tsx views
  icon: string;
  status: 'live' | 'development';
  description: string;
}

// 🌐 Added setView prop to communicate back to the master App shell
interface HomeProps {
  setView: (view: 'home' | 'slots' | 'blackjack' | 'cashier') => void;
}

export default function Home({ setView }: HomeProps) {
  const [jackpot, setJackpot] = useState<number>(1245190.00);

  // Live ticking jackpot effect for casino immersion
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpot(prev => prev + Math.random() * 2.50);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const games: GameCard[] = [
    { title: 'Ace Empire Spins', slug: 'slots', icon: '🎰', status: 'live', description: 'Stateful server-validated slot matrix engine.' },
    { title: 'Neon Roulette', slug: 'home', icon: '🎡', status: 'development', description: 'High-stakes physics-simulated predictive wheel.' },
    { title: 'Cyber Blackjack', slug: 'blackjack', icon: '🃏', status: 'live', description: 'Deals against the master system mainframe dealer.' }
  ];

  return (
    <div style={{ backgroundColor: '#07080a', minHeight: '100vh', fontFamily: 'monospace', color: '#fff', padding: '2rem' }}>
      
      {/* Top Welcome Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #111317 0%, #1a1d24 100%)', border: '2px solid #33394d', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h1 style={{ color: '#00ffcc', textShadow: '0 0 15px rgba(0,255,204,0.4)', fontSize: '2.5rem', margin: '0 0 1rem 0', letterSpacing: '2px' }}>♠️ ACE EMPIRE TERMINAL</h1>
        <p style={{ color: '#8892b0', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          Welcome to the matrix grid. Experience next-generation, server-side validated stateful games.
        </p>
        <button 
          onClick={() => setView('slots')} // Clean application state trigger
          style={{ backgroundColor: '#ff007f', color: '#fff', border: 'none', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,0,127,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}
        >
          🎰 Launch Live Reels
        </button>
      </div>

      {/* Real-time Global Ticker Bar */}
      <div style={{ background: '#111317', borderLeft: '4px solid #ff007f', borderRight: '4px solid #ff007f', borderRadius: '6px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
        <span style={{ color: '#8892b0', fontWeight: 'bold', letterSpacing: '1px' }}>🔥 MEGA JACKPOT ENGINE:</span>
        <span style={{ color: '#00ffcc', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,255,204,0.5)' }}>
          ${jackpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Grid Header */}
      <h2 style={{ color: '#fff', borderBottom: '2px solid #222633', paddingBottom: '0.5rem', marginBottom: '2rem', letterSpacing: '1px' }}>🎮 AVAILABLE GAMING ARRAYS</h2>

      {/* Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {games.map((game, idx) => (
          <div key={idx} style={{ background: '#111317', border: `2px solid ${game.status === 'live' ? '#ff007f' : '#222633'}`, borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease', boxShadow: game.status === 'live' ? '0 5px 15px rgba(255,0,127,0.1)' : 'none' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{game.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: game.status === 'live' ? 'rgba(255,0,127,0.15)' : '#222633', color: game.status === 'live' ? '#ff007f' : '#8892b0', border: `1px solid ${game.status === 'live' ? '#ff007f' : '#33394d'}` }}>
                  {game.status}
                </span>
              </div>
              <h3 style={{ color: '#00ffcc', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{game.title}</h3>
              <p style={{ color: '#8892b0', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>{game.description}</p>
            </div>

            <button 
              disabled={game.status !== 'live'}
              onClick={() => setView(game.slug)} // Clean application state trigger
              style={{ width: '100%', padding: '0.8rem', backgroundColor: game.status === 'live' ? '#222633' : '#07080a', border: `1px solid ${game.status === 'live' ? '#ff007f' : '#222633'}`, color: game.status === 'live' ? '#fff' : '#444', fontWeight: 'bold', borderRadius: '6px', cursor: game.status === 'live' ? 'pointer' : 'not-allowed', textTransform: 'uppercase', transition: 'all 0.2s' }}
            >
              {game.status === 'live' ? '⚡ Initialize Link' : '🔒 Array Locked'}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}