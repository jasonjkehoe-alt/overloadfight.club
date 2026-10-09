import React, { memo } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import HeatTable, { HeatCell } from '../HeatTable';
import DetailsTable from '../DetailsTable';
import RampLegend from '../RampLegend';
import Link from '../Link';
import { RANKED, winRate } from '../../server/lib/gameParse.js';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { fetchSpecialists, SpecialistCell } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';

// Matches on a map before its win rate colours the cell.
export const SPECIALIST_MIN = 3;

const record = (c: SpecialistCell) => `${c.wins}-${c.losses}${c.ties ? `-${c.ties}` : ''}`;

// A pilot's record on a map: coloured by win rate from SPECIALIST_MIN matches,
// the record alone below that.
const cell = (name: string, map: string, c: SpecialistCell | null): HeatCell | null => {
    if (!c) return null;
    const rate = winRate(c.wins, c.matches);
    const few = c.matches < SPECIALIST_MIN;
    return {
        share: few ? null : rate / 100,
        text: few ? record(c) : `${Math.round(rate)}%`,
        title: `${name} on ${map}: ${record(c)} in ${c.matches} match${c.matches === 1 ? '' : 'es'}, ${rate}% won${few ? ` (under ${SPECIALIST_MIN}, not coloured)` : ''}`
    };
};

// Pilot × map grid (S16): the pilots with the most ranked matches against
// the maps with the most, each cell their record there, from
// /api/stats/specialists (the stats worker's pilot_maps table).
const SpecialistGrid: React.FC = () => {
    const { data, failed, retry } = useLoad(fetchSpecialists, []);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Specialists unavailable" message="Could not load the pilot and map grid." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading specialists..." />;
    } else if (data.pilots.length === 0) {
        body = <EmptyState compact icon={MapIcon} title="No ranked matches yet" />;
    } else {
        body = (
            <>
                <p className="text-xs text-gray-400 mb-3">
                    The {data.pilots.length} pilots with the most ranked matches on the {data.maps.length} maps played most. Darker is a higher win rate; a cell with under {SPECIALIST_MIN} matches shows the record alone.
                </p>
                <HeatTable
                    caption={`Each pilot's win rate on each map over ranked matches (${RANKED.pilots}+ pilots, ${RANKED.seconds} s or more) with a result.`}
                    corner="Pilot"
                    columns={data.maps.map(m => ({ key: m.map, label: m.map, title: `${m.map}: ${m.matches.toLocaleString()} ranked matches` }))}
                    rows={data.pilots.map((p, i) => ({
                        key: p.pilot,
                        label: <Link to={urlFor('pilot', p.name)} className="hover:text-brand" title={`${p.name}: ${p.matches.toLocaleString()} ranked matches`}>{p.name}</Link>,
                        cells: data.maps.map((m, j) => cell(p.name, m.map, data.cells[i][j]))
                    }))}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-2xs text-gray-500">
                    <span>Wins over matches played; a tie is not a win.</span>
                    <RampLegend />
                </div>
                <DetailsTable
                    summary="Records by pilot and map"
                    headers={['Pilot', ...data.maps.map(m => m.map)]}
                    rows={data.pilots.map((p, i) => ({ key: p.pilot, cells: [p.name, ...data.maps.map((m, j) => { const c = data.cells[i][j]; return c ? record(c) : '–'; })] }))}
                />
            </>
        );
    }

    return (
        <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="specialists-title">
            <h3 id="specialists-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                Specialists <span className="normal-case tracking-normal font-normal">(win rate by pilot and map)</span>
            </h3>
            {body}
        </section>
    );
};

export default memo(SpecialistGrid);
