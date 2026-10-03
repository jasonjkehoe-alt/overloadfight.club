import React, { useEffect, useState } from 'react';
import { Activity, Crosshair, TrendingUp, Users, Target, Zap, Info } from 'lucide-react';

interface PPIStats {
    akdr: number;
    kpm: number;
    tce: number;
    aci?: number;
    pure_kd?: number;
    wins?: number;
    losses?: number;
    ties?: number;
    win_rate?: number;
    total_damage?: number;
    dpm?: number;
    flight_hours?: number;
    finisher_rating: number;
    arsenal_entropy: number;
    threat_centrality: number;
    dominance_index: number;
}

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => {
    return (
        <div className="group relative flex items-center">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-black border border-[#ff6600] text-xs text-gray-300 rounded shadow-[0_0_10px_#ff660040] z-50 font-mono">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#ff6600] w-0 h-0"></div>
            </div>
        </div>
    );
};

// "Sci-Fi / Tactical" Stat Block
const TechStat = ({ label, value, unit, tooltip, color = "text-white" }: any) => (
    <div className="bg-[#0a0a0a] border border-gray-800 p-3 rounded relative hover:border-[#ff6600] transition-colors group">
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</span>
            <Tooltip text={tooltip}>
                <Info size={12} className="text-gray-700 hover:text-[#ff6600] cursor-help" />
            </Tooltip>
        </div>
        <div className={`text-2xl font-bold font-mono ${color} leading-none`}>
            {value}
            {unit && <span className="text-sm text-gray-600 ml-1">{unit}</span>}
        </div>
    </div>
);

const PilotPerformanceCard = ({ pilotName }: { pilotName: string }) => {
    const [stats, setStats] = useState<PPIStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPPI = async () => {
            try {
                const res = await fetch(`/api/pilot/${encodeURIComponent(pilotName)}/ppi`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("PPI Fetch Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPPI();
    }, [pilotName]);

    if (loading) return <div className="animate-pulse h-32 bg-[#111] rounded border border-gray-800"></div>;
    if (!stats || !stats.akdr) return null; // No data yet

    return (
        <div className="w-full bg-[#111]/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                <Activity className="text-[#ff6600]" size={20} />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest brand-font">Performance Intelligence</h3>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-green-900/20 text-green-400 border border-green-900 rounded font-mono uppercase">Live Analytics</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 1. Adjusted K/D (aKDR) */}
                <TechStat
                    label="Adjusted K/D"
                    value={stats.akdr.toFixed(2)}
                    tooltip="Standard K/D adjusted to value Assists (0.33 weighting). A more holistic measure of combat contribution."
                    color="text-[#00ffff]"
                />

                {/* 2. Combat Impact (ACI) */}
                <TechStat
                    label="Combat Impact (ACI)"
                    value={stats.aci !== undefined ? (stats.aci > 0 ? `+${stats.aci.toFixed(2)}` : stats.aci.toFixed(2)) : stats.tce.toFixed(1)}
                    unit="/ match"
                    tooltip="Average Combat Impact (ACI): (Kills + 0.5*Assists - Deaths) / Sorties. Normalizes net combat contribution per match without favoring total games played."
                    color="text-[#ff00ff]"
                />

                {/* 3. Real KPM */}
                <TechStat
                    label="Lethality"
                    value={stats.kpm.toFixed(2)}
                    unit="KPM"
                    tooltip="Kills Per Minute calculated from actual elapsed combat flight time."
                />

                {/* 4. Dominance Index */}
                <TechStat
                    label="Dominance Index"
                    value={stats.dominance_index.toFixed(1)}
                    unit="%"
                    tooltip="The percentage of unique enemy pilots you have a winning record against. Hunting new targets raises this score; farming the same rookie does not."
                    color="text-[#ffea00]"
                />

                {/* 5. Threat Centrality */}
                <TechStat
                    label="Threat Tier"
                    value={stats.threat_centrality.toFixed(0)}
                    unit="/ 100"
                    tooltip="A ranking based on the quality of your victims. To become the Boss, you have to kill the Boss."
                    color="text-[#ff4500]"
                />

                {/* 6. Finisher Rating */}
                <TechStat
                    label="Finisher Rate"
                    value={(stats.finisher_rating * 100).toFixed(0)}
                    unit="%"
                    tooltip="Ratio of Kills to Total Participations (Kills + Assists). High rating means you secure the kill; low means you soften targets for others."
                />

            </div>
        </div>
    );
};

export default PilotPerformanceCard;
