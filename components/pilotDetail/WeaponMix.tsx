import React, { memo } from 'react';
import { Crosshair } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import DetailsTable from '../DetailsTable';
import { chart } from '../../designTokens.js';
import { RANKED, WEAPON_FAMILIES } from '../../server/lib/gameParse.js';
import { percent } from '../../server/lib/matchResult.js';
import { PilotWeaponMix } from '../../services/apiService';

// The pilot's mark and the community's: the accent hue and the palette's
// de-emphasis grey (the dataviz emphasis form), so the pilot is the point and
// the community the context.
const PILOT = chart.series;
const COMMUNITY = chart.label;

const share = (kills: number, total: number) => (total ? kills / total : 0);

// Weapon mix vs the community (S16): a dumbbell per weapon family, the
// pilot's share of their logged kills on opponents beside everyone's, in
// hand-drawn HTML (no chart chunk), with a table for the keyboard.
const WeaponMix: React.FC<{ load: { data: PilotWeaponMix | null; failed: boolean; retry: () => void } }> = ({ load: { data, failed, retry } }) => {
    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Weapon mix unavailable" message="Could not load the weapon mix." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading weapon mix..." />;
    } else if (data.kills === 0) {
        body = <EmptyState compact icon={Crosshair} title="No logged kills" message="The weapon mix counts kills from matches whose kill log the tracker kept; none of this pilot's ranked matches has one." />;
    } else {
        const families = WEAPON_FAMILIES.filter(f => f.id !== 'other' || data.pilot.other > 0 || data.community.other > 0);
        const rows = families.map(f => ({ ...f, mine: share(data.pilot[f.id] || 0, data.kills), theirs: share(data.community[f.id] || 0, data.communityKills) }));
        // the axis runs to the next tenth above the largest share
        const max = Math.max(0.1, Math.ceil(Math.max(...rows.flatMap(r => [r.mine, r.theirs])) * 10) / 10);
        const at = (s: number) => `${(s / max) * 100}%`;
        const favourite = rows.reduce((best, r) => (r.mine > best.mine ? r : best), rows[0]);
        const biggest = rows.reduce((best, r) => (Math.abs(r.mine - r.theirs) > Math.abs(best.mine - best.theirs) ? r : best), rows[0]);
        const signed = (d: number) => `${d > 0 ? '+' : ''}${(d * 100).toFixed(1)} points`;
        body = (
            <>
                <p className="text-xs text-gray-400 mb-3">
                    <span className="text-white font-bold">{favourite.label}</span> {percent(favourite.mine)} of {data.kills.toLocaleString()} logged kills.
                    {' '}Furthest from the community: {biggest.label}, {signed(biggest.mine - biggest.theirs)}.
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-gray-400 mb-2" aria-hidden>
                    <li className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PILOT }} />This pilot</li>
                    <li className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COMMUNITY }} />Everyone</li>
                </ul>
                <div role="img" aria-label={`Share of kills by weapon family, this pilot against everyone: ${rows.map(r => `${r.label} ${percent(r.mine)} against ${percent(r.theirs)}`).join('; ')}.`}>
                    {rows.map(r => {
                        const [lo, hi] = [Math.min(r.mine, r.theirs), Math.max(r.mine, r.theirs)];
                        return (
                            <div key={r.id} className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-3 py-0.5" title={`${r.label}: this pilot ${percent(r.mine, 1)} (${(data.pilot[r.id] || 0).toLocaleString()} kills), everyone ${percent(r.theirs, 1)} (${(data.community[r.id] || 0).toLocaleString()})`}>
                                <span className="text-xs text-gray-400 truncate" title={r.label}>{r.label.split(',')[0]}</span>
                                <div className="relative h-4">
                                    <div className="absolute inset-y-1/2 left-0 right-0 h-px" style={{ backgroundColor: chart.grid }} />
                                    <div className="absolute top-1/2 -mt-px h-0.5" style={{ left: at(lo), width: `calc(${at(hi)} - ${at(lo)})`, backgroundColor: chart.axis }} />
                                    <span className="absolute top-1/2 -mt-1 -ml-1 w-2 h-2 rounded-full" style={{ left: at(r.theirs), backgroundColor: COMMUNITY }} />
                                    <span className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 rounded-full border-2" style={{ left: at(r.mine), backgroundColor: PILOT, borderColor: chart.ink }} />
                                </div>
                                <span className="text-xs text-right tabular-nums"><span className="text-white font-bold">{percent(r.mine)}</span> <span className="text-gray-500">vs {percent(r.theirs)}</span></span>
                            </div>
                        );
                    })}
                    <div className="grid grid-cols-[6.5rem_1fr_5.5rem] gap-3 text-2xs text-gray-500">
                        <span />
                        <span className="flex justify-between"><span>0%</span><span>{percent(max)}</span></span>
                        <span />
                    </div>
                </div>
                <p className="text-2xs text-gray-500 mt-1">Kills on opponents in ranked matches ({RANKED.pilots}+ pilots, {RANKED.seconds} s or more) whose kill log the tracker kept, as a share of each side's logged kills. Everyone: {data.communityKills.toLocaleString()} kills.</p>
                <DetailsTable
                    summary="Kills by weapon family"
                    headers={['Family', 'Pilot kills', 'Pilot share', 'Everyone', 'Everyone share']}
                    rows={rows.map(r => ({ key: r.id, cells: [r.label, (data.pilot[r.id] || 0).toLocaleString(), percent(r.mine, 1), (data.community[r.id] || 0).toLocaleString(), percent(r.theirs, 1)] }))}
                />
            </>
        );
    }

    return (
        <div className="bg-surface-card border border-line p-4 rounded-card mt-4">
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Weapon mix vs the community</h4>
            {body}
        </div>
    );
};

// memo: the pilot page re-renders on every mode and rival change
export default memo(WeaponMix);
