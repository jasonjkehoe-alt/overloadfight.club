import React, { useEffect, useState } from 'react';
import { Activity, Crosshair, TrendingUp, Users, Target, Zap, Info } from 'lucide-react';
import { LETHALITY_HINT } from '../server/lib/gameParse.js';

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
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-black border border-brand text-xs text-gray-300 rounded-control shadow-[0_0_10px] shadow-brand/25 z-50 font-mono">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-brand w-0 h-0"></div>
            </div>
        </div>
    );
};

// "Sci-Fi / Tactical" Stat Block
const TechStat = ({ label, value, unit, tooltip, color = "text-white" }: any) => (
    <div className="bg-surface-page border border-line p-3 rounded-card relative hover:border-brand transition-colors group">
        <div className="flex justify-between items-start mb-1">
            <span className="text-2xs uppercase tracking-widest text-gray-500 font-bold">{label}</span>
            <Tooltip text={tooltip}>
                <Info size={12} className="text-gray-700 hover:text-brand cursor-help" />
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

    if (loading) return <div className="animate-pulse h-32 bg-surface-card rounded-card border border-line"></div>;
    if (!stats || stats.kpm === undefined) return null; // No data yet

    return (
        <div className="w-full bg-surface-card/50 backdrop-blur-sm border border-line rounded-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-6 border-b border-line pb-4">
                <Activity className="text-brand" size={20} />
                <h3 className="text-lg font-bold text-white uppercase tracking-widest brand-font">Performance Intelligence</h3>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-2xs px-2 py-0.5 bg-green-900/20 text-green-400 border border-green-900 rounded-control font-mono uppercase">Live Analytics</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* 1. Combat Impact (ACI) */}
                <TechStat
                    label="Combat Impact (ACI)"
                    value={stats.aci !== undefined ? (stats.aci > 0 ? `+${stats.aci.toFixed(2)}` : stats.aci.toFixed(2)) : stats.tce.toFixed(1)}
                    unit="/ match"
                    tooltip="Average Combat Impact (ACI): (Kills + 0.5*Assists - Deaths) / Matches. Normalizes net combat contribution per match without favoring total matches played."
                    color="text-cyan-400"
                />

                {/* 2. Real KPM */}
                <TechStat
                    label="Lethality"
                    value={stats.kpm.toFixed(2)}
                    unit="KPM"
                    tooltip={LETHALITY_HINT}
                    color="text-white"
                />

                {/* 3. Dominance Index */}
                <TechStat
                    label="Dominance Index"
                    value={stats.dominance_index.toFixed(1)}
                    unit="%"
                    tooltip="The percentage of unique enemy pilots you have a winning record against (min 3 shared matches). Ties count as 0.5."
                    color="text-yellow-300"
                />

                {/* 4. Threat Centrality */}
                <TechStat
                    label="Threat Tier"
                    value={stats.threat_centrality.toFixed(0)}
                    unit="/ 100"
                    tooltip="A ranking based on the quality of your victims. To become the Boss, you have to kill the Boss."
                    color="text-orange-600"
                />

                {/* 5. Finisher Rating */}
                <TechStat
                    label="Finisher Rate"
                    value={(stats.finisher_rating * 100).toFixed(0)}
                    unit="%"
                    tooltip="Ratio of Kills to Total Participations (Kills + Assists). High rating means you secure the kill; low means you soften targets for others."
                    color="text-emerald-400"
                />

            </div>
        </div>
    );
};

export default PilotPerformanceCard;
