import React, { useMemo } from 'react';
import { GameData } from '../../types';
import Link from '../Link';
import { teamColor } from './teamColor';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { combatRatio, netKills, pilotKey, scoreboardAt, COMBAT_RATIO_HINT } from '../../server/lib/gameParse.js';

const NO_DAMAGE_TIMES = 'The damage log has no times, so damage shows for the whole match only.';

interface ScoreboardProps {
    game: GameData;
    durationSec: number;
    // the scrubber's second, or null for the final scoreboard
    time: number | null;
}

// The overview tab's table. At the end it shows the tracker's own numbers;
// scrubbed back, kills, assists, deaths and Combat Ratio come from the kill
// log replayed to that second, and the order follows them.
const Scoreboard: React.FC<ScoreboardProps> = ({ game, durationSec, time }) => {
    const finalRows = useMemo(() => {
        if (!game.players) return [];

        const durationMinutes = durationSec / 60;

        return game.players.map(p => {
            // Calculate damage from events if not present in player object
            let totalDamage = p.damage || 0;
            if (!totalDamage && game.damage) {
                totalDamage = game.damage
                    .filter(d => d.attacker === p.name)
                    .reduce((sum, d) => sum + d.damage, 0);
            }

            const dpm = durationMinutes > 0 ? totalDamage / durationMinutes : null;
            const kda = combatRatio(netKills(p), p.assists, p.deaths);

            return {
                ...p,
                totalDamage,
                dpm,
                kda
            };
        }).sort((a, b) => b.kills - a.kills);
    }, [game, durationSec]);

    const rows = useMemo(() => {
        if (time === null) return finalRows;
        const replayed = new Map(scoreboardAt(game, time).players.map(r => [pilotKey(r.name), r]));
        return finalRows.map(p => {
            const r = replayed.get(pilotKey(p.name)) ?? { kills: 0, assists: 0, deaths: 0 };
            return { ...p, kills: r.kills, assists: r.assists, deaths: r.deaths, kda: combatRatio(netKills(r), r.assists, r.deaths) };
        }).sort((a, b) => b.kills - a.kills);
    }, [game, time, finalRows]);

    const scrubbed = time !== null;

    return (
        <div className="bg-surface-card border border-line rounded-card overflow-hidden overflow-x-auto">
            <table className="w-full text-left font-mono text-sm min-w-[800px]">
                <thead className="bg-surface-raised text-gray-400 text-xs uppercase font-bold">
                    <tr>
                        <th className="p-4">Pilot</th>
                        <th className="p-4 text-right">Kills</th>
                        <th className="p-4 text-right">Assists</th>
                        <th className="p-4 text-right">Deaths</th>
                        <th className="p-4 text-right" title={scrubbed ? NO_DAMAGE_TIMES : undefined}>Damage</th>
                        <th className="p-4 text-right" title={scrubbed ? NO_DAMAGE_TIMES : undefined}>DPM</th>
                        <th className="p-4 text-right cursor-help" title={COMBAT_RATIO_HINT}>Combat Ratio</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {rows.map((p, idx) => (
                        <tr key={p.name} className="hover:bg-surface-raised transition-colors">
                            <td className="p-4 font-bold text-white flex items-center gap-3">
                                <span className="text-gray-600 w-4">{idx + 1}</span>
                                <Link
                                    to={urlFor('pilot', p.name)}
                                    className={`hover:underline hover:text-brand transition-colors text-left font-bold ${teamColor(p.team)}`}
                                    title={`View ${p.name}'s pilot dossier`}
                                >
                                    {p.name}
                                </Link>
                            </td>
                            <td className="p-4 text-right text-lg">{p.kills}</td>
                            <td className="p-4 text-right text-gray-400">{p.assists}</td>
                            <td className="p-4 text-right text-red-400">{p.deaths}</td>
                            <td className="p-4 text-right text-gray-300">
                                {scrubbed ? '–' : Math.round(p.totalDamage).toLocaleString()}
                            </td>
                            <td className="p-4 text-right text-gray-500">
                                {scrubbed || p.dpm === null ? '–' : Math.round(p.dpm).toLocaleString()}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-brand font-bold text-base">{p.kda.toFixed(2)}</span>
                                    <span className="text-2xs text-gray-500">
                                        ({p.kills} K, {p.assists} A, {p.deaths} D)
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Scoreboard;
