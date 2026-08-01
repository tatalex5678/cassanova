import mongoose from 'mongoose';
import Game from './models/Game';

const MONGODB_URI = 'mongodb+srv://at004:cassanova123@casino-game.dqlvtj8.mongodb.net/cassanova?retryWrites=true&w=majority';

const sampleGames = [
  {
    title: "Ace Empire Spins",
    slug: "ace-empire-spins",
    provider: "Cassanova Studios",
    category: "slots",
    thumbnail: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500",
    description: "High-octane neon slot grid with multipliers.",
    rtp: 96.5,
    volatility: "high",
    features: ["Free Spins", "Multipliers"],
    minBet: 0.20,
    maxBet: 200,
    launchUrl: "http://localhost:5050/games/ace-spins",
    isFeatured: true
  },
  {
    title: "Cyber Blackjack VIP",
    slug: "cyber-blackjack-vip",
    provider: "Cassanova Studios",
    category: "table-games",
    thumbnail: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500",
    description: "Classic 21 wrapped in a glowing custom matrix layout.",
    rtp: 99.2,
    volatility: "medium",
    features: ["Side Bets", "Multi-Hand"],
    minBet: 1.00,
    maxBet: 500,
    launchUrl: "http://localhost:5050/games/cyber-bj",
    isPopular: true
  }
];

async function seedDatabase() {
  try {
    console.log("Connecting to data cluster...");
    await mongoose.connect(MONGODB_URI);
    
    console.log("Clearing existing game documents...");
    await Game.deleteMany({});
    
    console.log("Injecting premium gaming matrix items...");
    await Game.insertMany(sampleGames);
    
    console.log("=== SEEDING COMPLETED SUCCESSFULLY ===");
    process.exit(0);
  } catch (error) {
    console.error("Critical seeding failure:", error);
    process.exit(1);
  }
}

seedDatabase();