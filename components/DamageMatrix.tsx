
import React from 'react';
import { GameData } from '../types';
import Link from './Link';
import { EmptyState } from './States';
import { urlFor } from '../server/lib/siteRoutes.js';

interface DamageMatrixProps {
  game: GameData;
}

const DamageMatrix: React.FC<DamageMatrixProps> = ({ game }) => {
  if (!game.players || !game.damage) return <EmptyState title="No damage data available." />;

  const sortedPlayers = [...game.players].sort((a, b) => a.name.localeCompare(b.name));
  
  // Calculate damage cell value from the damage array
  const getDamage = (attacker: string, defender: string) => {
    return game.damage!
      .filter(d => d.attacker === attacker && d.defender === defender)
      .reduce((sum, d) => sum + d.damage, 0);
  };

  return (
    <div className="overflow-x-auto bg-surface-card border border-line p-4 rounded-card">
      <h3 className="text-gray-300 mb-4 font-bold">Damage Matrix</h3>
      <table className="w-full text-sm text-gray-400 border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-brand border-b border-r border-line sticky left-0 bg-surface-card z-10">Attacker \ Defender</th>
            {sortedPlayers.map(p => (
              <th key={p.name} className="p-2 border-b border-line min-w-[80px] text-center">
                <Link
                  to={urlFor('pilot', p.name)}
                  className="truncate w-20 mx-auto hover:text-brand hover:underline transition-colors block"
                  title={`View ${p.name}'s pilot dossier`}
                >
                  {p.name}
                </Link>
              </th>
            ))}
            <th className="p-2 border-b border-l border-line text-white font-bold">Total Dealt</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(attacker => {
            const totalDealt = sortedPlayers.reduce((acc, def) => acc + getDamage(attacker.name, def.name), 0);
            return (
              <tr key={attacker.name} className="hover:bg-surface-raised">
                <td className="p-2 border-r border-b border-line font-medium text-white sticky left-0 bg-surface-card z-10">
                  <Link
                    to={urlFor('pilot', attacker.name)}
                    className="hover:text-brand hover:underline transition-colors text-left"
                    title={`View ${attacker.name}'s pilot dossier`}
                  >
                    {attacker.name}
                  </Link>
                </td>
                {sortedPlayers.map(defender => {
                  const dmg = getDamage(attacker.name, defender.name);
                  const isSelf = attacker.name === defender.name;
                  
                  let cellClass = "p-2 border-b border-line text-center tabular-nums";
                  if (isSelf && dmg > 0) cellClass += " bg-red-950/40 text-red-500"; // Self damage
                  else if (dmg > 0) cellClass += " text-gray-200";
                  else cellClass += " text-gray-800";

                  return (
                    <td key={defender.name} className={cellClass}>
                      {dmg > 0 ? Math.round(dmg) : '-'}
                    </td>
                  );
                })}
                <td className="p-2 border-l border-b border-line text-center font-bold text-brand tabular-nums">
                    {Math.round(totalDealt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DamageMatrix;
