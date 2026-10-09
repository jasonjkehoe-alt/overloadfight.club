import React, { memo } from 'react';
import { Crosshair } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from '../States';
import HeatTable, { HeatCell } from '../HeatTable';
import DetailsTable from '../DetailsTable';
import RampLegend from '../RampLegend';
import { RANKED, WEAPON_FAMILIES } from '../../server/lib/gameParse.js';
import { percent } from '../../server/lib/matchResult.js';
import { fetchWeaponMeta } from '../../services/apiService';
import { useLoad } from '../../hooks/useLoad';

// The family's share of a map's logged kills; the colour follows the share.
const cell = (map: string, family: string, kills: number, total: number): HeatCell => ({
    share: total ? kills / total : null,
    text: total ? percent(kills / total) : '–',
    title: `${map}, ${family}: ${kills.toLocaleString()} of ${total.toLocaleString()} kills (${total ? percent(kills / total, 1) : 'none'})`
});

// Weapon × map heatmap (S16): each map's logged kills on opponents split by
// weapon family, with an "All maps" row for the community, from
// /api/stats/weapons (the stats worker's map_weapons table).
const WeaponMeta: React.FC = () => {
    const { data, failed, retry } = useLoad(fetchWeaponMeta, []);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Weapon meta unavailable" message="Could not load the weapon meta." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading weapon meta..." />;
    } else if (data.kills === 0) {
        body = <EmptyState compact icon={Crosshair} title="No logged kills yet" message="The weapon meta counts kills from matches whose kill log the tracker kept." />;
    } else {
        // Other only when a kill fell outside the seven families
        const families = WEAPON_FAMILIES.filter(f => f.id !== 'other' || data.community.other > 0);
        const rows = [{ map: 'All maps', kills: data.kills, families: data.community }, ...data.maps];
        const top = families.reduce((best, f) => (data.community[f.id] > data.community[best.id] ? f : best), families[0]);
        body = (
            <>
                <p className="text-xs text-gray-400 mb-3">
                    <span className="text-white font-bold">{top.label}</span> leads with {percent(data.community[top.id] / data.kills)} of {data.kills.toLocaleString()} logged kills.
                    {' '}The {data.maps.length} map{data.maps.length === 1 ? '' : 's'} with the most logged kills; darker is a larger share of that map's kills.
                </p>
                <HeatTable
                    caption={`Share of each map's logged kills by weapon family. Ranked matches (${RANKED.pilots}+ pilots, ${RANKED.seconds} s or more) with a kill log; kills on opponents only.`}
                    corner="Map"
                    columns={families.map(f => ({ key: f.id, label: f.label.split(',')[0], title: f.label }))}
                    rows={rows.map(r => ({
                        key: r.map,
                        label: r.map,
                        cells: families.map(f => cell(r.map, f.label, r.families[f.id] || 0, r.kills))
                    }))}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-2xs text-gray-500">
                    <span>A column is a weapon family (its first weapon names it): {families.map(f => f.label).join('; ')}.</span>
                    <RampLegend />
                </div>
                <DetailsTable
                    summary="Kills by weapon family, by map"
                    headers={['Map', ...families.map(f => f.label.split(',')[0]), 'Kills']}
                    rows={rows.map(r => ({ key: r.map, cells: [r.map, ...families.map(f => (r.kills ? percent((r.families[f.id] || 0) / r.kills) : '–')), r.kills.toLocaleString()] }))}
                />
            </>
        );
    }

    return (
        <section className="bg-surface-card border border-line rounded-card p-4" aria-labelledby="weapon-meta-title">
            <h3 id="weapon-meta-title" className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">
                Weapon meta <span className="normal-case tracking-normal font-normal">(kill share by map)</span>
            </h3>
            {body}
        </section>
    );
};

export default memo(WeaponMeta);
