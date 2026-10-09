import React from 'react';
import DetailsTable from '../DetailsTable';
import { CLUTCH, CLUTCH_HINT } from '../../server/lib/gameParse.js';
import { percent } from '../../server/lib/matchResult.js';
import { ClutchCounts } from '../../services/apiService';

type Counts = Omit<ClutchCounts, 'kind'>;
const KINDS = [{ kind: 'ffa', label: 'FFA' }, { kind: 'team', label: 'Team' }] as const;
const add = (rows: ClutchCounts[]): Counts => rows.reduce((t, r) => ({
    matches: t.matches + r.matches, first_bloods: t.first_bloods + r.first_bloods, kills: t.kills + r.kills,
    late_kills: t.late_kills + r.late_kills, trailing_kills: t.trailing_kills + r.trailing_kills
}), { matches: 0, first_bloods: 0, kills: 0, late_kills: 0, trailing_kills: 0 });
const rate = (part: number, whole: number) => (whole > 0 ? percent(part / whole) : '–');

// The three clutch numbers: the share and its counts, with everyone's share.
const TILES: { label: string; part: keyof Counts; whole: keyof Counts; of: string }[] = [
    { label: 'First blood', part: 'first_bloods', whole: 'matches', of: 'matches' },
    { label: `Last ${CLUTCH.lateSeconds} s`, part: 'late_kills', whole: 'kills', of: 'kills' },
    { label: 'While trailing', part: 'trailing_kills', whole: 'kills', of: 'kills' }
];

// The clutch profile (S17): first-blood rate, the share of kills in the last
// minute and the share made while trailing, each beside the community's, from
// pilot_clutch; FFA and team games apart in the table.
const ClutchProfile: React.FC<{ clutch: ClutchCounts[]; community: ClutchCounts[] }> = ({ clutch, community }) => {
    const mine = add(clutch);
    const everyone = add(community);
    const row = (label: string, c: Counts) => ({ key: label, cells: [label, c.matches.toLocaleString(), c.first_bloods.toLocaleString(), c.kills.toLocaleString(), c.late_kills.toLocaleString(), c.trailing_kills.toLocaleString()] });
    return (
        <div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2" title={CLUTCH_HINT}>Clutch</h4>
            <dl className="grid grid-cols-3 gap-2">
                {TILES.map(t => (
                    <div key={t.label} className="bg-surface-raised rounded-control p-2 sm:p-3">
                        <dt className="text-2xs text-gray-500 uppercase tracking-wider">{t.label}</dt>
                        <dd className="text-xl sm:text-2xl font-bold text-white">{rate(mine[t.part], mine[t.whole])}</dd>
                        <dd className="text-2xs text-gray-400">{mine[t.part].toLocaleString()} of {mine[t.whole].toLocaleString()} {t.of}</dd>
                        <dd className="text-2xs text-gray-500">Everyone {rate(everyone[t.part], everyone[t.whole])}</dd>
                    </div>
                ))}
            </dl>
            <p className="text-2xs text-gray-500 mt-2">{CLUTCH_HINT} In FFA every pilot but the leader is trailing, so that share runs higher there than in team games.</p>
            <DetailsTable
                summary="Clutch by kind of match"
                headers={['Kind', 'Matches', 'First bloods', 'Kills', `Last ${CLUTCH.lateSeconds} s`, 'Trailing']}
                rows={[
                    ...KINDS.map(k => row(k.label, add(clutch.filter(c => c.kind === k.kind)))),
                    row('All', mine),
                    row('Everyone', everyone)
                ]}
            />
        </div>
    );
};

export default ClutchProfile;
