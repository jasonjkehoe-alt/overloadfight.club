
import React from 'react';
import { GameData } from '../types';

interface DamageMatrixProps {
  game: GameData;
  onNavigate?: (view: string, param?: string) => void;
}

const DamageMatrix: React.FC<DamageMatrixProps> = ({ game, onNavigate }) => {
  if (!game.players || !game.damage) return <div>No damage data available.</div>;

  const sortedPlayers = [...game.players].sort((a, b) => a.name.localeCompare(b.name));
  
  // Calculate damage cell value from the damage array
  const getDamage = (attacker: string, defender: string) => {
    return game.damage!
      .filter(d => d.attacker === attacker && d.defender === defender)
      .reduce((sum, d) => sum + d.damage, 0);
  };

  return (
    <div className="overflow-x-auto bg-[#111] border border-gray-800 p-4 rounded">
      <h3 className="text-gray-300 mb-4 font-bold">Damage Matrix</h3>
      <table className="w-full text-sm text-gray-400 border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-[#ff6600] border-b border-r border-gray-800 sticky left-0 bg-[#111] z-10">Attacker \ Defender</th>
            {sortedPlayers.map(p => (
              <th key={p.name} className="p-2 border-b border-gray-800 min-w-[80px] text-center">
                <button
                  onClick={() => onNavigate && onNavigate('pilot', p.name)}
                  className="truncate w-20 mx-auto hover:text-[#ff6600] hover:underline transition-colors block"
                  title={`View ${p.name}'s pilot dossier`}
                >
                  {p.name}
                </button>
              </th>
            ))}
            <th className="p-2 border-b border-l border-gray-800 text-white font-bold">Total Dealt</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map(attacker => {
            const totalDealt = sortedPlayers.reduce((acc, def) => acc + getDamage(attacker.name, def.name), 0);
            return (
              <tr key={attacker.name} className="hover:bg-[#1a1a1a]">
                <td className="p-2 border-r border-b border-gray-800 font-medium text-white sticky left-0 bg-[#111] z-10">
                  <button
                    onClick={() => onNavigate && onNavigate('pilot', attacker.name)}
                    className="hover:text-[#ff6600] hover:underline transition-colors text-left"
                    title={`View ${attacker.name}'s pilot dossier`}
                  >
                    {attacker.name}
                  </button>
                </td>
                {sortedPlayers.map(defender => {
                  const dmg = getDamage(attacker.name, defender.name);
                  const isSelf = attacker.name === defender.name;
                  
                  let cellClass = "p-2 border-b border-gray-800 text-center tabular-nums";
                  if (isSelf && dmg > 0) cellClass += " bg-[#2a1010] text-red-500"; // Self damage
                  else if (dmg > 0) cellClass += " text-gray-200";
                  else cellClass += " text-gray-800";

                  return (
                    <td key={defender.name} className={cellClass}>
                      {dmg > 0 ? Math.round(dmg) : '-'}
                    </td>
                  );
                })}
                <td className="p-2 border-l border-b border-gray-800 text-center font-bold text-[#ff6600] tabular-nums">
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
