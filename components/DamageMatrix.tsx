import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { GameData } from '../types';
import Link from './Link';
import { EmptyState } from './States';
import HeatTable, { HeatCell } from './HeatTable';
import RampLegend from './RampLegend';
import { urlFor } from '../server/lib/siteRoutes.js';
import { damageGrid } from '../server/lib/gameParse.js';
import { percent } from '../server/lib/matchResult.js';

interface DamageMatrixProps {
  game: GameData;
}

// The match's damage flow (S17): gameParse.js damageGrid() as dealer rows by
// target columns, self-damage and teammates included as the tracker logged
// them, each cell coloured by its share of the damage dealt to other pilots,
// the diagonal (self-damage) left uncoloured, and each dealer's total. A
// cell between two pilots opens their tape, the dealer first (S20).
const DamageMatrix: React.FC<DamageMatrixProps> = ({ game }) => {
  const grid = useMemo(() => damageGrid(game), [game]);
  if (!grid) return <EmptyState card icon={Activity} title="No damage log" message="The tracker did not keep a damage log for this match, so there is no damage to show." />;

  const { pilots, dealt, mate, out, total } = grid;
  const team = pilots.some(p => p.team);
  const round = (n: number) => Math.round(n).toLocaleString();
  const who = (p: typeof pilots[number]) => (p.team ? `${p.name} (${p.team})` : p.name);
  const cell = (i: number, j: number): HeatCell => {
    const v = dealt[i][j];
    const [from, to] = [pilots[i], pilots[j]];
    if (i === j) return { share: null, text: v > 0 ? round(v) : '–', title: `${from.name}: ${round(v)} self-damage` };
    return {
      share: v > 0 && total > 0 ? v / total : null,
      text: v > 0 ? round(v) : '–',
      title: `${from.name} on ${to.name}${mate[i][j] ? ' (teammate)' : ''}: ${round(v)} damage, ${percent(total ? v / total : 0, 1)} of the match's damage to other pilots. Opens their tale of the tape.`,
      to: urlFor('tape', from.name, to.name)
    };
  };

  return (
    <section className="bg-surface-card border border-line p-4 rounded-card" aria-labelledby="damage-flow-title">
      <h3 id="damage-flow-title" className="text-gray-300 mb-2 font-bold">Damage flow</h3>
      <p className="text-xs text-gray-400 mb-3">
        {round(total)} damage dealt to other pilots in this match's damage log. Rows deal, columns take{team ? ', grouped by team' : ''}; a lighter cell is a larger share. Self-damage sits on the diagonal, uncoloured. Click a cell for the two pilots' tale of the tape.
      </p>
      <HeatTable
        caption="Damage by each pilot (rows) on each pilot (columns) from the match's damage log, coloured by the share of the damage dealt to other pilots; the diagonal is self-damage."
        corner="Dealer"
        columns={[...pilots.map(p => ({ key: p.key, label: <Link to={urlFor('pilot', p.name)} className="hover:text-brand hover:underline">{p.name}</Link>, title: who(p) })), { key: '\ntotal', label: 'To others', title: 'Damage dealt to other pilots' }]}
        rows={pilots.map((p, i) => ({
          key: p.key,
          label: <Link to={urlFor('pilot', p.name)} className="hover:text-brand hover:underline" title={who(p)}>{p.name}</Link>,
          cells: [...pilots.map((_, j) => cell(i, j)), { share: null, text: round(out[i]), title: `${p.name}: ${round(out[i])} damage dealt to other pilots` }]
        }))}
      />
      <div className="flex justify-end mt-3"><RampLegend /></div>
    </section>
  );
};

export default DamageMatrix;
