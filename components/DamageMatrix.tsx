import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { GameData } from '../types';
import Link from './Link';
import { EmptyState } from './States';
import HeatTable, { HeatCell } from './HeatTable';
import RampLegend from './RampLegend';
import { urlFor } from '../server/lib/siteRoutes.js';
import { pilotKey, teamOf } from '../server/lib/gameParse.js';
import { percent } from '../server/lib/matchResult.js';

interface DamageMatrixProps {
  game: GameData;
}

// The match's damage flow (S17): dealer rows by target columns over the whole
// damage log, self-damage and teammates included as the tracker logged them,
// each cell coloured by its share of the damage dealt to other pilots, the
// diagonal (self-damage) left uncoloured, and each dealer's total.
const DamageMatrix: React.FC<DamageMatrixProps> = ({ game }) => {
  const grid = useMemo(() => {
    const log = Array.isArray(game.damage) ? game.damage : [];
    if (log.length === 0) return null;
    // each pilot once, by team in a team game (BLUE, ORANGE, ...), then by name
    const seen = new Set<string>();
    const pilots = (game.players || [])
      .map(p => ({ key: pilotKey(p.name), name: p.name.trim(), team: teamOf(p) as string | null }))
      .filter(p => p.key && !seen.has(p.key) && seen.add(p.key))
      .sort((a, b) => (a.team ?? '').localeCompare(b.team ?? '') || a.name.localeCompare(b.name));
    const at = new Map(pilots.map((p, i) => [p.key, i]));
    const dealt = pilots.map(() => pilots.map(() => 0));
    for (const d of log) {
      const [i, j] = [at.get(pilotKey(d.attacker)), at.get(pilotKey(d.defender))];
      if (i !== undefined && j !== undefined) dealt[i][j] += Number(d.damage) || 0;
    }
    const total = dealt.reduce((sum, row, i) => sum + row.reduce((s, v, j) => (i === j ? s : s + v), 0), 0);
    return { pilots, dealt, total, team: pilots.some(p => p.team) };
  }, [game]);

  if (!grid) return <EmptyState card icon={Activity} title="No damage log" message="The tracker did not keep a damage log for this match, so there is no damage to show." />;

  const { pilots, dealt, total, team } = grid;
  const round = (n: number) => Math.round(n).toLocaleString();
  const cell = (i: number, j: number): HeatCell => {
    const v = dealt[i][j];
    const [from, to] = [pilots[i], pilots[j]];
    if (i === j) return { share: null, text: v > 0 ? round(v) : '–', title: `${from.name}: ${round(v)} self-damage` };
    const mate = team && from.team && from.team === to.team ? ' (teammate)' : '';
    return { share: v > 0 && total > 0 ? v / total : null, text: v > 0 ? round(v) : '–', title: `${from.name} on ${to.name}${mate}: ${round(v)} damage, ${percent(total ? v / total : 0, 1)} of the match's damage to other pilots` };
  };
  const label = (p: typeof pilots[number]) => (
    <Link to={urlFor('pilot', p.name)} className="hover:text-brand hover:underline" title={p.team ? `${p.name} (${p.team})` : p.name}>{p.name}</Link>
  );

  return (
    <section className="bg-surface-card border border-line p-4 rounded-card" aria-labelledby="damage-flow-title">
      <h3 id="damage-flow-title" className="text-gray-300 mb-2 font-bold">Damage flow</h3>
      <p className="text-xs text-gray-400 mb-3">
        {round(total)} damage dealt to other pilots in this match's damage log. Rows deal, columns take{team ? ', grouped by team' : ''}; a lighter cell is a larger share. Self-damage sits on the diagonal, uncoloured.
      </p>
      <HeatTable
        caption="Damage by each pilot (rows) on each pilot (columns) from the match's damage log, coloured by the share of the damage dealt to other pilots; the diagonal is self-damage."
        corner="Dealer"
        columns={[...pilots.map(p => ({ key: p.key, label: p.name, title: p.team ? `${p.name} (${p.team})` : p.name })), { key: '\ntotal', label: 'Total', title: 'Damage dealt to other pilots' }]}
        rows={pilots.map((p, i) => {
          const out = dealt[i].reduce((s, v, j) => (i === j ? s : s + v), 0);
          return {
            key: p.key,
            label: label(p),
            cells: [...pilots.map((_, j) => cell(i, j)), { share: null, text: round(out), title: `${p.name}: ${round(out)} damage dealt to other pilots` }]
          };
        })}
      />
      <div className="flex justify-end mt-3"><RampLegend /></div>
    </section>
  );
};

export default DamageMatrix;
