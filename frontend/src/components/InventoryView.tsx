import React from 'react';

// Make sure your games array exists at the top so the .map() doesn't fail
const initialGames = [
  { id: '1', title: 'Ace Empire Spin', type: 'Slot', limit: '$10,000', rtp: '96.5%' },
  { id: '2', title: 'Diamond Royale', type: 'Slot', limit: '$25,000', rtp: '97.2%' },
  { id: '3', title: 'Blackjack VIP', type: 'Table', limit: '$50,000', rtp: '99.4%' },
  { id: '4', title: 'Neon Dice Blast', type: 'Dice', limit: '$5,000', rtp: '95.8%' }
];

export default function InventoryView() {
  return (
    <div className="space-y-6">
      <header className="pb-6 border-b-2 border-red-950/60">
        <h2 className="text-3xl font-black text-white">GAMING CATALOG MODULES</h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialGames.map((game) => (
          <div key={game.id} className="bg-[#07090e] border border-red-950 p-5 rounded">
            <h4 className="text-lg font-black text-[#dfb76c]">{game.title}</h4>
            <p className="text-xs text-gray-400 font-mono mt-1">LIMIT: {game.limit} // RTP: {game.rtp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}