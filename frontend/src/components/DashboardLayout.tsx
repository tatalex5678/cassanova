import React, { useState, useEffect } from 'react';
import InventoryView from './InventoryView';
import ClientsView from './ClientsView';
import AceEmpireSpin from '../AceEmpireSpin'; // Wired up live slot game component

export default function DashboardLayout() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'clients' | 'play-slots'>('dashboard');
  const [stats, setStats] = useState({ activeAssets: 0, pendingInquiries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            activeAssets: data.activeAssets || 0,
            pendingInquiries: data.pendingInquiries || 0
          });
        }
      } catch (error) {
        console.error("Error communicating with backend server:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#020204] text-[#f4f2ee] flex font-mono selection:bg-[#dfb76c] selection:text-black antialiased">
      
      {/* SIDEBAR: Cyber Terminal Console Chassis */}
      <aside 
        className="w-64 bg-[#05070a] border-r-2 border-red-600 flex flex-col justify-between p-5 relative z-10"
        style={{ boxShadow: '5px 0 30px rgba(239, 68, 68, 0.25)' }}
      >
        <div>
          {/* Neon Branded Header with Pulsing Spade */}
          <div className="mb-8 pb-5 border-b-2 border-dashed border-red-500/30">
            <h1 
              className="text-2xl font-black tracking-tighter text-[#dfb76c] flex items-center gap-2"
              style={{ filter: 'drop-shadow(0 0 12px rgba(223, 183, 108, 0.85))' }}
            >
              <span 
                className="animate-pulse text-red-500" 
                style={{ filter: 'drop-shadow(0 0 10px #ef4444)' }}
              >
                ♠
              </span> 
              ACE-EMPIRE
            </h1>
            <div 
              className="mt-2 text-[9px] font-black text-red-400 tracking-[0.25em] bg-red-950/50 px-2.5 py-1 rounded border border-red-500 uppercase inline-block"
              style={{ boxShadow: 'inset 0 0 8px rgba(239, 68, 68, 0.4), 0 0 10px rgba(239, 68, 68, 0.2)' }}
            >
              SYS-ADMIN NODE // ACTIVE
            </div>
          </div>

          {/* Navigation Buttons */}
          <nav className="space-y-4">
            {[
              { id: 'dashboard', label: 'VAULT OVERVIEW', icon: '⚡' },
              { id: 'play-slots', label: 'PLAY LIVE SLOTS', icon: '🎰' }, // Real active channel
              { id: 'inventory', label: 'GAMING CATALOG', icon: '⚙️' },
              { id: 'clients', label: 'PLAYER LEDGER', icon: '👥' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded border font-black text-xs tracking-widest transition-all duration-200 transform active:scale-95`}
                style={currentView === item.id ? {
                  background: 'linear-gradient(to right, rgba(153, 27, 27, 0.4), #0d111a, #05070a)',
                  borderColor: '#dfb76c',
                  color: '#dfb76c',
                  boxShadow: '0 0 20px rgba(223, 183, 108, 0.45), inset 0 0 8px rgba(223, 183, 108, 0.2)'
                } : {
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#6b7280'
                }}
              >
                <span style={{ filter: currentView === item.id ? 'drop-shadow(0 0 6px currentColor)' : 'none' }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Diagnostic Core Status Ticker */}
        <div className="pt-4 border-t-2 border-dashed border-red-500/30 text-[10px] text-gray-400 tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span 
              className="h-2.5 w-2.5 rounded-full bg-emerald-400 relative"
              style={{ boxShadow: '0 0 10px #10b981, 0 0 20px #34d399' }}
            ></span>
            <span className="font-black text-emerald-400">GRID_ONLINE</span>
          </div>
          <span className="text-red-500 font-black" style={{ filter: 'drop-shadow(0 0 5px #ef4444)' }}>SECURE</span>
        </div>
      </aside>

      {/* MAIN COCKPIT ENGINE MATRIX PANEL */}
      <main className="flex-1 p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2d0d0d] via-[#04060a] to-[#010102] overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
        
        <div className="relative z-10">
          {currentView === 'dashboard' ? (
            <div className="space-y-8">
              
              {/* Telemetry Control Header */}
              <header className="flex justify-between items-center pb-6 border-b-2 border-red-500/30">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-white" style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.45))' }}>
                    ⚡ MAIN CORE TELEMETRY MATRIX
                  </h2>
                  <p className="text-xs font-bold text-[#dfb76c] tracking-widest uppercase mt-1" style={{ filter: 'drop-shadow(0 0 8px rgba(223, 183, 108, 0.3))' }}>
                    EXECUTIVE COMMAND MAIN PANEL // MONGO_PORT: 5050 EXTRACTED
                  </p>
                </div>

                <div 
                  className="flex items-center gap-3 bg-[#05070a] border-2 border-red-500 px-4 py-2 rounded"
                  style={{ boxShadow: '0 0 25px rgba(239, 68, 68, 0.45), inset 0 0 10px rgba(239, 68, 68, 0.2)' }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-red-400 tracking-widest">LINK_ENCRYPT_ON</span>
                </div>
              </header>

              {/* MODULE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Active Cores Indicator Box */}
                <div 
                  className="bg-[#05070a] border-2 border-red-500/40 p-5 rounded-lg relative overflow-hidden group transition-all duration-300 hover:border-[#dfb76c]"
                  style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)' }}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[#dfb76c]" style={{ boxShadow: '0 0 12px #dfb76c' }}></div>
                  <h3 className="text-[10px] font-black tracking-widest text-gray-500 mb-2">// ACTIVE CORES LINKED</h3>
                  <div className="flex items-baseline justify-between">
                    <p className="text-5xl font-black text-white transition-all font-mono" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }}>
                      {loading ? "FETCH" : stats.activeAssets}
                    </p>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/50 rounded" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.3)' }}>CORE_OK</span>
                  </div>
                  <div className="mt-5 h-2 w-full bg-red-950/40 rounded overflow-hidden border border-black">
                    <div className="bg-[#dfb76c] h-full w-4/5" style={{ boxShadow: '0 0 10px #dfb76c, 0 0 20px #dfb76c' }}></div>
                  </div>
                </div>

                {/* Pending Queue Box */}
                <div 
                  className="bg-[#05070a] border-2 border-red-500/40 p-5 rounded-lg relative overflow-hidden transition-all duration-300 hover:border-red-500"
                  style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)' }}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500" style={{ boxShadow: '0 0 12px #ef4444' }}></div>
                  <h3 className="text-[10px] font-black tracking-widest text-gray-500 mb-2">// PENDING MATRIX TICKETS</h3>
                  <div className="flex items-baseline justify-between">
                    <p className="text-5xl font-black text-white font-mono">
                      {loading ? "FETCH" : stats.pendingInquiries}
                    </p>
                    <span className="text-[9px] font-black text-red-400 bg-red-950/60 px-2 py-0.5 border border-red-500/50 rounded animate-pulse" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.3)' }}>QUEUED</span>
                  </div>
                  <div className="mt-5 h-2 w-full bg-red-950/40 rounded overflow-hidden border border-black">
                    <div className="bg-gradient-to-r from-red-600 to-amber-500 h-full w-1/3" style={{ boxShadow: '0 0 10px #ef4444' }}></div>
                  </div>
                </div>

                {/* Crypto Engine Box */}
                <div 
                  className="bg-[#05070a] border-2 border-red-500/40 p-5 rounded-lg relative overflow-hidden transition-all duration-300 hover:border-emerald-500/50"
                  style={{ boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)' }}
                >
                  <h3 className="text-[10px] font-black tracking-widest text-gray-500 mb-2">// RNG CRYPTO HARDWARE ENGINE</h3>
                  <div className="bg-black p-2.5 rounded border border-red-950 flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono font-bold text-gray-400">MATH_SEED_ALPHA</span>
                    <span className="text-[10px] font-mono font-black text-emerald-400" style={{ filter: 'drop-shadow(0 0 8px #10b981)' }}>SECURE_STATE</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 font-bold tracking-wide font-mono">
                    <span>BIAS_RATIO: <span className="text-emerald-400 font-black">96.4%</span></span>
                    <span className="animate-pulse text-emerald-400 font-black text-[9px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/60">● SOLID_UPTIME</span>
                  </div>
                </div>

              </div>

              {/* INDUSTRIAL PANIC SWITCHBOARD CHASSIS */}
              <div 
                className="bg-gradient-to-r from-[#07090f] to-[#140808] border-2 border-red-500/40 p-6 rounded-lg"
                style={{ boxShadow: '0 0 30px rgba(239,68,68,0.15), inset 0 0 20px rgba(0,0,0,0.9)' }}
              >
                <h3 className="text-[11px] font-black tracking-[0.25em] text-[#dfb76c] mb-4 uppercase" style={{ filter: 'drop-shadow(0 0 8px rgba(223, 183, 108, 0.5))' }}>
                  ⚡ MASTER ILLUMINATED BREAK INTERRUPTS
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button 
                    className="bg-gradient-to-b from-red-700 to-red-950 text-white font-black text-xs tracking-widest py-3.5 px-6 rounded border-2 border-red-500 transition-all duration-150 uppercase active:translate-y-0.5"
                    style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.45), inset 0 0 10px rgba(239, 68, 68, 0.2)' }}
                  >
                    🛑 INITIATE CORE GRID EMERGENCY HARD KILLSWITCH
                  </button>
                  <button 
                    className="bg-gradient-to-b from-amber-600 to-amber-900 text-white font-black text-xs tracking-widest py-3.5 px-6 rounded border-2 border-amber-500 transition-all duration-150 uppercase active:translate-y-0.5"
                    style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.35), inset 0 0 10px rgba(245, 158, 11, 0.1)' }}
                  >
                    ⚠️ FREEZE ASSET OUTFLOW SYSTEMS LIQUIDITY
                  </button>
                </div>
              </div>

            </div>
          ) : currentView === 'inventory' ? (
            <InventoryView />
          ) : currentView === 'play-slots' ? (
            <AceEmpireSpin />
          ) : (
            <ClientsView />
          )}
        </div>
      </main>
    </div>
  );
}