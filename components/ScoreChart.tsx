
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GameData } from '../types';
import { colors } from '../designTokens.js';

interface ScoreChartProps {
  game: GameData;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ game }) => {
  
  const { chartData, leadChanges } = useMemo(() => {
    if (!game.kills || !game.players) return { chartData: [], leadChanges: [] };

    const sortedKills = [...game.kills].sort((a, b) => a.time - b.time);
    const players = game.players.map(p => p.name);
    
    // Initialize scores
    const currentScores: Record<string, number> = {};
    players.forEach(p => currentScores[p] = 0);

    const dataPoints = [];
    dataPoints.push({ time: 0, ...currentScores });

    const changes: number[] = [];
    let currentLeader = '';

    sortedKills.forEach(kill => {
        const isSuicide = kill.attacker === kill.defender;
        const isTeamKill = kill.attackerTeam && kill.attackerTeam === kill.defenderTeam && kill.attackerTeam !== 'ANARCHY';
        
        if (isSuicide || isTeamKill) {
            currentScores[kill.attacker] = (currentScores[kill.attacker] || 0) - 1;
        } else {
            currentScores[kill.attacker] = (currentScores[kill.attacker] || 0) + 1;
        }

        // Check leader
        let maxScore = -999;
        let leader = '';
        Object.entries(currentScores).forEach(([p, s]) => {
            if (s > maxScore) {
                maxScore = s;
                leader = p;
            }
        });

        if (leader !== currentLeader && currentLeader !== '') {
            changes.push(kill.time);
        }
        currentLeader = leader;

        dataPoints.push({
            time: kill.time,
            ...currentScores
        });
    });
    
    // Add final point at game end
    if (game.settings?.timeLimit) {
        dataPoints.push({
            time: game.settings.timeLimit,
            ...currentScores
        });
    }

    return { chartData: dataPoints, leadChanges: changes };
  }, [game]);

  const lineColors = [colors.brand.DEFAULT, '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'];
  const playerNames = game.players?.map(p => p.name) || [];

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-[400px] bg-surface-card border border-line p-4 rounded-card">
      <h3 className="text-gray-300 mb-4 font-bold">Score Progression</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="time" 
            stroke="#666" 
            tickFormatter={formatTime}
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis stroke="#666" />
          <Tooltip 
            contentStyle={{ backgroundColor: colors.surface.raised, borderColor: colors.line, color: '#fff', borderRadius: '4px' }}
            labelFormatter={(val) => formatTime(val as number)}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#ccc' }}
          />
          <Legend />
          {playerNames.map((player, index) => (
            <Line
              key={player}
              type="stepAfter"
              dataKey={player}
              stroke={lineColors[index % lineColors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
          {leadChanges.map((time, i) => (
              <ReferenceLine key={i} x={time} stroke="#666" strokeDasharray="3 3" label={{ value: 'Lead Change', fontSize: 10, fill: '#666', position: 'insideTopLeft' }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreChart;
