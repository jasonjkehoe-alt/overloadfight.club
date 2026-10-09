import React, { memo } from 'react';
import HeatTable, { HeatCell } from '../HeatTable';
import DetailsTable from '../DetailsTable';
import RampLegend from '../RampLegend';
import Link from '../Link';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { percent, shortCount } from '../../server/lib/matchResult.js';
import { RivalNetwork } from '../../services/apiService';

export type GridBy = 'kills' | 'damage';
const WORD: Record<GridBy, { unit: string; total: string; title: string; corner: string; rows: string; columns: string }> = {
    kills: { unit: 'kills', total: 'logged kills on opponents', title: 'Kills', corner: 'Killer', rows: 'who killed', columns: 'who died' },
    damage: { unit: 'damage', total: 'logged damage to opponents', title: 'Damage', corner: 'Dealer', rows: 'who dealt the damage', columns: 'who took it' }
};

// The rivalry network (S17): killer rows by victim columns among the pilots
// with the most logged kills on opponents, each cell coloured by its share of
// the row's total over every opponent (so a row reads as where that pilot's
// kills, or damage, went), the diagonal empty.
const RivalGrid: React.FC<{ data: RivalNetwork; by: GridBy }> = ({ data, by }) => {
    const values = data[by];
    const totals = data.pilots.map(p => p[by]);
    const word = WORD[by];
    const cell = (i: number, j: number): HeatCell | null => {
        const v = values[i][j];
        if (v === null) return null;
        const [from, to] = [data.pilots[i].name, data.pilots[j].name];
        const share = totals[i] ? v / totals[i] : 0;
        return {
            share: v > 0 ? share : null,
            text: v > 0 ? shortCount(v) : '–',
            title: `${from} on ${to}: ${v.toLocaleString()} ${word.unit}, ${percent(share, 1)} of ${from}'s ${totals[i].toLocaleString()} ${word.total}`
        };
    };
    return (
        <>
            <HeatTable
                caption={`${word.title} by each pilot (rows) on each other pilot (columns), coloured by the share of the row's ${word.total}.`}
                corner={word.corner}
                columns={data.pilots.map(p => ({ key: p.pilot, label: p.name, title: p.name }))}
                rows={data.pilots.map((p, i) => ({
                    key: p.pilot,
                    label: <Link to={urlFor('pilot', p.name)} className="hover:text-brand hover:underline" title={p.name}>{p.name}</Link>,
                    cells: data.pilots.map((_, j) => cell(i, j))
                }))}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-2xs text-gray-500">
                <span>Rows: {word.rows}. Columns: {word.columns}. A lighter cell is a larger share of that row's {word.total}.</span>
                <RampLegend />
            </div>
            <DetailsTable
                summary={`${word.title} between these pilots`}
                headers={[word.corner, ...data.pilots.map(p => p.name), 'Total']}
                rows={data.pilots.map((p, i) => ({ key: p.pilot, cells: [p.name, ...values[i].map(v => (v === null ? '–' : v.toLocaleString())), totals[i].toLocaleString()] }))}
            />
        </>
    );
};

export default memo(RivalGrid);
