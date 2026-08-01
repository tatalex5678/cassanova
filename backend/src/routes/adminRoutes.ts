import { Router, Request, Response } from 'express';
import Game from '../models/Game'; // Pulls your clean schema configuration

const router = Router();

// 1. LIVE TELEMETRY STATS ENGINE
router.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    // Count total game assets matching your live MongoDB cluster catalog
    const activeAssets = await Game.countDocuments({});
    const pendingInquiries = 5; // Ticker placeholder 

    res.json({
      activeAssets,
      pendingInquiries
    });
  } catch (error) {
    console.error("Telemetry query breakdown:", error);
    res.status(500).json({ error: "Internal telemetry grid failure" });
  }
});

// 2. LIVE CATALOG INVENTORY PIPE
router.get('/api/games', async (req: Request, res: Response) => {
  try {
    // Fetches every game document stored inside your database cluster
    const games = await Game.find({});
    res.json(games);
  } catch (error) {
    console.error("Catalog query breakdown:", error);
    res.status(500).json({ error: "Failed to pull gaming collections" });
  }
});

export default router;