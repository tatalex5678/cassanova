import React from 'react';

const initialPlayers = [
  { id: '1', username: 'testplayer99', tier: 'VIP Gold', balance: '$12,450.00', compliance: 'Verified', activity: 'Active' },
  { id: '2', username: 'highroller_77', tier: 'VIP Platinum', balance: '$84,200.00', compliance: 'Verified', activity: 'Active' },
  { id: '3', username: 'lucky_slotter', tier: 'Standard', balance: '$350.50', compliance: 'Pending ID', activity: 'Idle' },
  { id: '4', username: 'risk_flag_user', tier: 'Standard', balance: '$12.00', compliance: 'Suspended', activity: 'Banned' },
];

export default function ClientsView() {
  return (
    <div className="space-y-6">
      
      {/* Cyber Table Control Header */}
      <header className="flex justify-between items-center pb-6 border-b-2 border-red-950/60">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
            PLAYER LEDGER TARGET DATA
          </h2>
          <p className="text-xs font-bold text-[#bc9c64] tracking-widest uppercase mt-1">
            Realtime Bankrolls // Risk Matrices // Verification Vectors
          </p>
        </div>
        <button className="bg-gradient-to-b from-[#dfb76c] to-[#b8952e] text-black font-black text-xs tracking-widest py-2.5 px-5 rounded hover:from-[#f3ce8a] transition-all border border-[#dfb76c]/40 shadow-[0_0_15px_rgba(223,183,108,0.25)] uppercase">
          [+] FLAG THREAT PATHWAY
        </button>
      </header>

      {/* Cyberpunk Mesh Grid Table Frame */}
      <div className="bg-[#07090e] border border-red-950 rounded shadow-[0_15px_40px_rgba(0,0,0,0.7)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/60 text-[#bc9c64] text-[10px] uppercase tracking-[0.2em] border-b border-red-950">
              <th className="p-4 font-black">User Target ID</th>
              <th className="p-4 font-black">Account Rank</th>
              <th className="p-4 font-black">Ledger Wallet Balance</th>
              <th className="p-4 font-black">KYC Matrix State</th>
              <th className="p-4 font-black">Node Status</th>
              <th className="p-4 font-black text-right">System Directives</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-950/40 text-xs text-[#f4f2ee]">
            {initialPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-red-950/10 transition-colors duration-150 group">
                {/* Gold Matrix Username */}
                <td className="p-4 font-black text-white group-hover:text-[#dfb76c] transition-colors font-mono">
                  {player.username}
                </td>
                
                {/* Tier Rank Display */}
                <td className="p-4 font-bold tracking-wider text-gray-400 uppercase">
                  [{player.tier}]
                </td>
                
                {/* Neon Laser Payout Balance Indicator */}
                <td className="p-4 font-black text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.15)] font-mono">
                  {player.balance}
                </td>
                
                {/* Compliance State Matrices */}
                <td className="p-4">
                  <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                    player.compliance === 'Verified' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60 shadow-[0_0_8px_rgba(16,185,129,0.1)]' :
                    player.compliance === 'Pending ID' ? 'bg-amber-950/40 text-amber-400 border-amber-900/60 shadow-[0_0_8px_rgba(245,158,11,0.1)]' :
                    'bg-red-950/40 text-red-400 border-red-900/60 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                  }`}>
                    {player.compliance}
                  </span>
                </td>
                
                {/* Ping Node State Bulb */}
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      player.activity === 'Active' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' :
                      player.activity === 'Idle' ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 
                      'bg-red-500 shadow-[0_0_6px_#f87171]'
                    }`} />
                    <span className="text-gray-400 font-bold uppercase tracking-wide text-[10px]">{player.activity}</span>
                  </div>
                </td>
                
                {/* Mechanical Core Commands */}
                <td className="p-4 text-right space-x-2 font-mono">
                  <button className="text-[10px] font-black text-[#bc9c64] hover:text-[#dfb76c] underline transition-colors uppercase">
                    [AUDIT_LOGS]
                  </button>
                  <button className="text-[10px] font-black text-red-400 bg-red-950/30 border border-red-900/40 px-2 py-1 rounded hover:bg-red-900/40 hover:text-red-300 transition-all uppercase">
                    FREEZE_NODE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}