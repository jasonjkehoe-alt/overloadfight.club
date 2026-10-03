
import { GameData, KillEvent, PlayerData } from '../types';

export const calculateNemesis = (kills: KillEvent[] = []) => {
    const pairs: Record<string, number> = {};
    let maxCount = 0;
    let bestPair = { p1: '', p2: '', count: 0 };

    kills.forEach(k => {
        if (k.attacker && k.defender && k.attacker !== k.defender) {
            // Create a consistent key regardless of order
            const key = [k.attacker, k.defender].sort().join(' vs ');
            pairs[key] = (pairs[key] || 0) + 1;
            
            if (pairs[key] > maxCount) {
                maxCount = pairs[key];
                const [p1, p2] = key.split(' vs ');
                bestPair = { p1, p2, count: maxCount };
            }
        }
    });

    return maxCount > 0 ? bestPair : null;
};

export const calculateWeaponStats = (game: GameData) => {
    const stats: Record<string, { kills: number; damage: number }> = {};

    game.kills?.forEach(k => {
        if (!stats[k.weapon]) stats[k.weapon] = { kills: 0, damage: 0 };
        stats[k.weapon].kills++;
    });

    game.damage?.forEach(d => {
        if (!stats[d.weapon]) stats[d.weapon] = { kills: 0, damage: 0 };
        stats[d.weapon].damage += d.damage;
    });

    return Object.entries(stats)
        .map(([name, stat]) => ({ name, ...stat }))
        .sort((a, b) => b.damage - a.damage);
};

export const calculateStreaks = (kills: KillEvent[] = []) => {
    const streaks: Record<string, number> = {};
    const currentStreaks: Record<string, number> = {};
    
    const sortedKills = [...kills].sort((a, b) => a.time - b.time);

    sortedKills.forEach(k => {
        // Increment attacker streak
        if (k.attacker && k.attacker !== k.defender) {
            currentStreaks[k.attacker] = (currentStreaks[k.attacker] || 0) + 1;
            if ((currentStreaks[k.attacker] || 0) > (streaks[k.attacker] || 0)) {
                streaks[k.attacker] = currentStreaks[k.attacker];
            }
        }
        // Reset defender streak
        if (k.defender) {
            currentStreaks[k.defender] = 0;
        }
    });

    // Find max
    let bestStreak = { player: '', count: 0 };
    Object.entries(streaks).forEach(([player, count]) => {
        if (count > bestStreak.count) bestStreak = { player, count };
    });

    return bestStreak.count > 2 ? bestStreak : null;
};

export const calculatePlayStyles = (game: GameData) => {
    if (!game.players || !game.damage) return [];

    const totalDamageTaken: Record<string, number> = {};
    game.damage.forEach(d => {
        totalDamageTaken[d.defender] = (totalDamageTaken[d.defender] || 0) + d.damage;
    });

    return game.players.map(p => {
        const dmgDealt = p.damage || 0;
        const dmgTaken = totalDamageTaken[p.name] || 1; // avoid div/0
        const ratio = dmgDealt / dmgTaken;
        
        let style = 'Balanced';
        if (ratio > 1.5 && p.deaths > (game.players!.length > 2 ? 5 : 2)) style = 'Glass Cannon';
        if (p.timeInGame && p.timeInGame > 60 && dmgDealt < 500 && p.deaths > 5) style = 'Punching Bag';
        if (ratio < 0.5 && p.deaths < 5) style = 'Pacifist';
        if (ratio > 2.0 && p.deaths < 5) style = 'Juggernaut';

        return { name: p.name, style, ratio };
    });
};

export const calculateKillHeatmap = (kills: KillEvent[] = [], durationMinutes: number = 15) => {
    const buckets: { minute: number; count: number }[] = [];
    const numBuckets = Math.ceil(durationMinutes);
    
    for(let i=0; i<=numBuckets; i++) buckets.push({ minute: i, count: 0 });

    kills.forEach(k => {
        const minute = Math.floor(k.time / 60);
        if (buckets[minute]) buckets[minute].count++;
    });

    return buckets;
};

export const calculateFirstBlood = (kills: KillEvent[] = []) => {
    const sorted = [...kills].sort((a, b) => a.time - b.time);
    // Filter out suicides for first blood
    const validKills = sorted.filter(k => k.attacker !== k.defender);
    return validKills.length > 0 ? validKills[0] : null;
};

export const calculateTeamSynergy = (players: PlayerData[]) => {
    const teams: Record<string, number> = {};
    players.forEach(p => {
        if (p.team && p.team !== 'NONE') {
            teams[p.team] = (teams[p.team] || 0) + p.assists;
        }
    });
    return teams;
};
