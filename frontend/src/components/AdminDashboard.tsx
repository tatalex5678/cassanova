import React, { useState, useEffect } from 'react';

interface VaultStats {
    vaultName: string;
    netRevenuePool: number;
    lifetimePlayerLosses: number;
    lifetimePlayerPayouts: number;
    houseEdgeMargin: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<VaultStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:5050/api/games/admin/vault-stats');
            if (!response.ok) throw new Error('Failed to retrieve vault metrics');
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Server connection error');
        } finally {
            setLoading(false);
        }
    };

    // Auto-poll the backend data ledger every 3 seconds for real-time tracking
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-400">Accessing main vault security protocols...</div>;
    if (error) return <div className="p-8 text-center text-red-500">⚠️ Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            {/* Header */}
            <div className="border-b border-gray-800 pb-5 mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                        CASSANOVA OWNER PORTAL
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">{stats?.vaultName}</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-950/50 border border-green-500/30 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs text-green-400 uppercase font-mono tracking-wider">Live Feed Connected</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Metric 1: Net Revenue Pool */}
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                    <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Net Vault Revenue</p>
                    <p className="text-3xl font-black mt-2 font-mono text-emerald-400">
                        ${stats?.netRevenuePool.toLocaleString()}
                    </p>
                </div>

                {/* Metric 2: Lifetime Player Losses */}
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                    <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Gross Intake (Player Losses)</p>
                    <p className="text-3xl font-black mt-2 font-mono text-blue-400">
                        ${stats?.lifetimePlayerLosses.toLocaleString()}
                    </p>
                </div>

                {/* Metric 3: Lifetime Player Payouts */}
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                    <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Total Payouts (Player Wins)</p>
                    <p className="text-3xl font-black mt-2 font-mono text-red-400">
                        ${stats?.lifetimePlayerPayouts.toLocaleString()}
                    </p>
                </div>

                {/* Metric 4: House Edge Margin */}
                <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                    <p className="text-xs uppercase font-semibold text-gray-400 tracking-wider">Current House Edge</p>
                    <p className="text-3xl font-black mt-2 font-mono text-amber-400">
                        {stats?.houseEdgeMargin}
                    </p>
                </div>

            </div>

            {/* Simulation Instructions block */}
            <div className="mt-12 bg-gray-800/30 border border-gray-800 p-6 rounded-2xl">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Simulating Live Transfers</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Keep this tab side-by-side with your game client window. As you spin the slots or play blackjack hands, you will notice the figures shifting automatically every 3 seconds to account for platform fluctuations.
                </p>
            </div>
        </div>
    );
}