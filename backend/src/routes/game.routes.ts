import { Router } from 'express';
import User from '../models/User'; 
import HouseWallet from '../models/HouseWallet'; 
// 🔐 Imported the authentication middleware to validate active session tokens
import { authenticateToken } from '../middleware/auth.middleware';
// 🛡️ Imported defensive security shields and rate-limiters
import { globalLimiter, adminLimiter, authorizeRoles } from '../middleware/security.middleware';

const router = Router();

// 🔐 GLOBAL MIDDLEWARE: Secures all game loops below and extracts req.userId from the Bearer token
router.use(authenticateToken);

// 🛡️ GLOBAL RATE LIMITER: Prevents automated script/bot spam across all gameplay endpoints
router.use(globalLimiter);

// 🌍 GLOBAL MEMORY LOG FOR LOCAL SIMULATION SESSIONS
const mockHouseVaultInstance = {
    vaultName: "Cassanova_Main_Vault (Virtual Dev Memory)",
    totalRevenue: 100000,
    totalPlayerLosses: 0,
    totalPlayerPayouts: 0,
    save: async () => { console.log("🏦 Dev-Bypass: Virtual House Vault updated."); }
};

// Helper utility to safely manage initialization of the central master vault
async function getOrCreateHouseVault() {
    let houseVault = await HouseWallet.findOne({ vaultName: "Cassanova_Main_Vault" });
    if (!houseVault) {
        houseVault = await HouseWallet.create({ vaultName: "Cassanova_Main_Vault" });
    }
    return houseVault;
}

// =========================================================================
// 🎰 1. SERVER-VALIDATED SLOT ROUTE WITH HOUSE REVENUE CAPTURE
// =========================================================================
router.post('/ace-empire-spin', async (req: any, res: any) => {
    const { betAmount } = req.body;
    let activeUserId = req.userId || "MOCK_DEV_USER_ID";

    if (!betAmount || betAmount <= 0) {
        return res.status(400).json({ message: "Invalid bet amount specification." });
    }

    try {
        let player;
        let houseVault: any = null;

        // Fetch house vault database architecture if in a real user environment
        if (activeUserId !== "MOCK_DEV_USER_ID") {
            player = await User.findById(activeUserId);
            houseVault = await getOrCreateHouseVault();
        }

        if (!player) {
            player = {
                username: "DevTester_Local",
                balance: 5000,
                save: async () => { console.log("💾 Dev-Bypass: Virtual Slots wallet updated."); }
            };
            // Pointing to our persistent server-side runtime memory object
            houseVault = mockHouseVaultInstance;
        }

        // 1. Core verification validation check
        if (player.balance < betAmount) {
            return res.status(400).json({ status: "failed", message: "💸 Insufficient revenue balance!" });
        }

        const previousBalance = player.balance;
        
        // Secure token allocation transfer from player wallet directly to the house
        player.balance -= betAmount; 
        houseVault.totalRevenue += betAmount;
        houseVault.totalPlayerLosses += betAmount;

        // 2. Compute randomized slot matrix results
        const availableSymbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '👑'];
        const reels = [
            availableSymbols[Math.floor(Math.random() * availableSymbols.length)],
            availableSymbols[Math.floor(Math.random() * availableSymbols.length)],
            availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
        ];

        // 3. Evaluate matching payout multipliers
        let winAmount = 0;
        let message = "";

        const uniqueCount = new Set(reels).size;

        if (uniqueCount === 1) {
            winAmount = betAmount * 5;
            message = `🎉 JACKPOT MAIN OVERRIDE! Three-of-a-kind match! +$${winAmount}`;
        } else if (uniqueCount === 2) {
            winAmount = betAmount * 2;
            message = `⚡ MATRIX LINKED! Double symbol payout achieved. +$${winAmount}`;
        } else {
            message = "❌ ACCESS REJECTED. Spin sequence resulted in zero parity.";
        }

        // Execute conditional release payload out of the house vault to the winner
        if (winAmount > 0) {
            houseVault.totalRevenue -= winAmount;
            houseVault.totalPlayerPayouts += winAmount;
            player.balance += winAmount;
        }

        // Commit all modifications to MongoDB collections if running live
        if (activeUserId !== "MOCK_DEV_USER_ID") {
            await player.save();
            await houseVault.save();
        } else {
            await player.save(); 
            await houseVault.save(); // safely hits the mock console trace logger
        }

        res.json({
            status: winAmount > 0 ? "win" : "loss",
            message,
            reels,
            betAmount,
            winAmount,
            previousBalance,
            newBalance: player.balance,
            username: player.username
        });

    } catch (error) {
        console.error("❌ ERROR EXECUTING SLOTS PIPELINE:", error);
        res.status(500).json({ message: "Internal game engine breakdown." });
    }
});

// =========================================================================
// 🃏 2. CYBER BLACKJACK ROUTE WITH HOUSE REVENUE CAPTURE
// =========================================================================
router.post('/blackjack-deal', async (req: any, res: any) => {
    const { betAmount, action, playerHand: clientPlayerHand, dealerHand: clientDealerHand, deck: clientDeck } = req.body;
    let activeUserId = req.userId || "MOCK_DEV_USER_ID";

    if (!betAmount || betAmount <= 0) {
        return res.status(400).json({ message: "Invalid bet amount" });
    }

    const createDeck = () => {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (let suit of suits) {
            for (let val of values) {
                deck.push({ value: val, suit });
            }
        }
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const calculateScore = (hand: any[]) => {
        let score = 0;
        let aces = 0;
        for (let card of hand) {
            if (['J', 'Q', 'K'].includes(card.value)) score += 10;
            else if (card.value === 'A') { score += 11; aces += 1; }
            else score += parseInt(card.value);
        }
        while (score > 21 && aces > 0) {
            score -= 10;
            aces -= 1;
        }
        return score;
    };

    try {
        let player;
        let houseVault: any = null;

        if (activeUserId !== "MOCK_DEV_USER_ID") {
            player = await User.findById(activeUserId);
            houseVault = await getOrCreateHouseVault();
        }

        if (!player) {
            player = {
                username: "DevTester_Local",
                balance: 5000,
                save: async () => { console.log("💾 Dev-Bypass: Virtual BJ wallet updated."); }
            };
            houseVault = mockHouseVaultInstance;
        }

        let deck = clientDeck || createDeck();
        let playerHand = clientPlayerHand || [];
        let dealerHand = clientDealerHand || [];
        let status = "playing";
        let message = "Your turn. Hit or Stand?";
        let winAmount = 0;

        // --- ACTION: INITIAL DEAL ---
        if (action === 'deal') {
            if (player.balance < betAmount) {
                return res.status(400).json({ status: "failed", message: "💸 Insufficient funds!" });
            }
            
            // Route initial stake out of balance into the platform treasury pool
            player.balance -= betAmount; 
            houseVault.totalRevenue += betAmount;
            houseVault.totalPlayerLosses += betAmount;

            playerHand = [deck.pop(), deck.pop()];
            dealerHand = [deck.pop(), deck.pop()];
            
            const pScore = calculateScore(playerHand);
            if (pScore === 21) {
                status = "player-blackjack";
                winAmount = betAmount * 2.5;
                
                houseVault.totalRevenue -= winAmount;
                houseVault.totalPlayerPayouts += winAmount;
                player.balance += winAmount;
                message = "🎉 CYBER BLACKJACK! System mainframe defeated.";
            }
        } 
        // --- ACTION: HIT ---
        else if (action === 'hit') {
            playerHand.push(deck.pop());
            const pScore = calculateScore(playerHand);
            if (pScore > 21) {
                status = "player-bust";
                message = "💥 CRITICAL BUST! Mainframe absorbed your tokens.";
            }
        } 
        // --- ACTION: STAND ---
        else if (action === 'stand') {
            let dScore = calculateScore(dealerHand);
            while (dScore < 17) {
                dealerHand.push(deck.pop());
                dScore = calculateScore(dealerHand);
            }

            const pScore = calculateScore(playerHand);
            if (dScore > 21) {
                status = "dealer-bust";
                winAmount = betAmount * 2;
                message = "🤖 MAINFRAME BUSTED! Tokens recovered.";
            } else if (pScore > dScore) {
                status = "player-win";
                winAmount = betAmount * 2;
                message = "⚡ LINK SUCCESS! You beat the dealer.";
            } else if (pScore < dScore) {
                status = "dealer-win";
                message = "❌ OVERRIDE FAILURE! Mainframe wins.";
            } else {
                status = "push";
                winAmount = betAmount; 
                message = "🤝 SIGNAL STABLE (Push). Tokens returned.";
            }
            
            if (winAmount > 0) {
                houseVault.totalRevenue -= winAmount;
                houseVault.totalPlayerPayouts += winAmount;
                player.balance += winAmount;
            }
        }

        if (activeUserId !== "MOCK_DEV_USER_ID") {
            await player.save();
            await houseVault.save();
        } else {
            await player.save();
            await houseVault.save();
        }

        res.json({
            status,
            message,
            playerHand,
            dealerHand,
            playerScore: calculateScore(playerHand),
            dealerScore: calculateScore(dealerHand),
            deck,
            newBalance: player.balance
        });

    } catch (error) {
        console.error("❌ ERROR EXECUTING BJ PIPELINE:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// =========================================================================
// 💳 3. OWNER REVENUE MONITORING PORTAL (ADMIN DASHBOARD ENDPOINT)
// =========================================================================
router.get('/admin/vault-stats', async (req: any, res: any) => {
    try {
        let vaultData: any;

        let dbVault = await HouseWallet.findOne({ vaultName: "Cassanova_Main_Vault" });
        if (dbVault) {
            vaultData = dbVault;
        } else {
            vaultData = mockHouseVaultInstance;
        }

        const profitMargin = vaultData.totalPlayerLosses > 0 
            ? ((vaultData.totalPlayerLosses - vaultData.totalPlayerPayouts) / vaultData.totalPlayerLosses) * 100 
            : 0;

        res.json({
            vaultName: vaultData.vaultName,
            netRevenuePool: vaultData.totalRevenue,
            lifetimePlayerLosses: vaultData.totalPlayerLosses,
            lifetimePlayerPayouts: vaultData.totalPlayerPayouts,
            houseEdgeMargin: `${profitMargin.toFixed(2)}%`
        });

    } catch (error) {
        console.error("❌ ERROR FETCHING VAULT METRICS:", error);
        res.status(500).json({ message: "Failed to access secure main vault data." });
    }
});

// =========================================================================
// 🏦 4. MANUAL OWNER EXTRACTION LEDGER UPDATE (HARDENED)
// =========================================================================
// Restricted: Must have 'admin' privileges, passes through brute-force rate defenses
router.post('/admin/owner-payout', adminLimiter, authorizeRoles('admin'), async (req: any, res: any) => {
    const { extractAmount } = req.body;
    let activeUserId = req.userId || "MOCK_DEV_USER_ID";

    if (!extractAmount || extractAmount <= 0) {
        return res.status(400).json({ message: "Specify a valid extraction amount." });
    }

    try {
        let houseVault: any;

        if (activeUserId !== "MOCK_DEV_USER_ID") {
            houseVault = await getOrCreateHouseVault();
        } else {
            houseVault = mockHouseVaultInstance;
        }

        // Safeguard: Check that you aren't pulling more than your tracking ledger holds
        if (houseVault.totalRevenue < extractAmount) {
            return res.status(400).json({ 
                message: `Extraction rejected. Requested $${extractAmount}, but vault only tracks $${houseVault.totalRevenue}.` 
            });
        }

        // Deduct the value from your tracking ledger
        houseVault.totalRevenue -= extractAmount;
        await houseVault.save();

        const profitMargin = houseVault.totalPlayerLosses > 0 
            ? ((houseVault.totalPlayerLosses - houseVault.totalPlayerPayouts) / houseVault.totalPlayerLosses) * 100 
            : 0;

        res.json({
            message: `💰 Recorded manual payout of $${extractAmount} matching your cold-cash extraction.`,
            netRevenuePool: houseVault.totalRevenue,
            lifetimePlayerLosses: houseVault.totalPlayerLosses,
            lifetimePlayerPayouts: houseVault.totalPlayerPayouts,
            houseEdgeMargin: `${profitMargin.toFixed(2)}%`
        });

    } catch (error) {
        console.error("❌ ERROR RECORDING OWNER PAYOUT:", error);
        res.status(500).json({ message: "Failed to update vault transaction logs." });
    }
});

// =========================================================================
// 💵 5. ADMIN DEPOSIT PORTAL (HARDENED)
// =========================================================================
// Restricted: Must have 'admin' privileges, passes through brute-force rate defenses
router.post('/admin/deposit', adminLimiter, authorizeRoles('admin'), async (req: any, res: any) => {
    const { username, depositAmount } = req.body;
    let activeUserId = req.userId || "MOCK_DEV_USER_ID";

    if (!username || !depositAmount || depositAmount <= 0) {
        return res.status(400).json({ message: "Please provide a valid username and deposit amount." });
    }

    try {
        // 1. Find the player by their username
        const player = await User.findOne({ username: username });
        if (!player) {
            return res.status(404).json({ message: `Player username '${username}' not found in database.` });
        }

        // 2. Fetch or create your master tracking vault
        let houseVault = (activeUserId !== "MOCK_DEV_USER_ID") 
            ? await getOrCreateHouseVault() 
            : mockHouseVaultInstance;

        // 3. Update balances: Credit the player's wallet & increase the system fluid pool
        const previousPlayerBalance = player.balance;
        player.balance += depositAmount;
        houseVault.totalRevenue += depositAmount;

        // Save modifications to MongoDB collections
        await player.save();
        await houseVault.save();

        res.json({
            message: `✅ SUCCESS: Loaded $${depositAmount} into ${username}'s wallet.`,
            playerCurrentBalance: player.balance,
            previousPlayerBalance: previousPlayerBalance,
            updatedNetRevenuePool: houseVault.totalRevenue
        });

    } catch (error) {
        console.error("❌ ERROR EXECUTING ADMIN DEPOSIT:", error);
        res.status(500).json({ message: "Failed to process player cash load-in." });
    }
});

export default router;