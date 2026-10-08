import { hotDb } from '../connection.js';
import '../migrations.js';
import { OUTCOME_FIELD, combatRatio, durationOf, lethality, netKills, outcomeOf, pairOutcome, pilotKey, rankedMatch, winnerOf } from '../../lib/gameParse.js';

// One pilot's numbers parsed from the game blobs: weapons, telemetry for the
// profile, and the map and rival breakdown.

// Weapon Normalization & Telemetry Engine
const WEAPON_MAP = {
    driller: 'Driller',
    flak: 'Flak',
    shotgun: 'Flak',
    thunderbolt: 'Thunderbolt',
    beam: 'Thunderbolt',
    impulse: 'Impulse',
    cyclone: 'Cyclone',
    crusher: 'Crusher',
    reflex: 'Reflex',
    lancer: 'Lancer',
    falcon: 'Falcon',
    missile_pod: 'Missile Pod',
    pod: 'Missile Pod',
    hunter: 'Hunter',
    smart: 'Hunter',
    creeper: 'Creeper',
    devastator: 'Devastator',
    timebomb: 'Time Bomb',
    vortex: 'Vortex',
    nova: 'Nova',
    flare: 'Flare'
};

export const PRIMARY_WEAPONS = new Set([
    'Driller', 'Flak', 'Thunderbolt', 'Impulse', 'Cyclone', 'Crusher', 'Reflex', 'Lancer'
]);

export const SECONDARY_WEAPONS = new Set([
    'Falcon', 'Missile Pod', 'Hunter', 'Creeper', 'Devastator', 'Time Bomb', 'Vortex', 'Nova', 'Flare'
]);

export function normalizeWeaponName(raw) {
    if (!raw) return 'Unknown';
    const lower = raw.toLowerCase().trim();
    for (const [key, val] of Object.entries(WEAPON_MAP)) {
        if (lower.includes(key)) return val;
    }
    if (lower.includes('misc') || lower.includes('collision') || lower === 'none') return 'Miscellaneous';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// A pilot's games in one file: the ids from game_players through
// idx_game_players_name_date, then the details by primary key. game_players
// stores names trimmed, and the NOCASE column ignores ASCII case.
const pilotGamesSql = (schema, since = '') => `
    SELECT details, date FROM ${schema}.games
    WHERE id IN (SELECT game_id FROM ${schema}.game_players WHERE name = TRIM(@name) ${since})
    ORDER BY date DESC
`;
export const pilotGamesHot = hotDb.prepare(pilotGamesSql('main'));
export const pilotGamesHotSince = hotDb.prepare(pilotGamesSql('main', 'AND date >= @startDate'));
export const pilotGamesCold = hotDb.prepare(pilotGamesSql('cold'));

// Hot games for a pilot, plus cold ones when hot holds fewer than 5.
function pilotGamesHotFirst(name) {
    const hotAll = pilotGamesHot.all({ name });
    return hotAll.length >= 5 ? hotAll : hotAll.concat(pilotGamesCold.all({ name }));
}

export function getPilotTelemetry(name, startDate, matchMode) {
    try {
        const cached = hotDb.prepare('SELECT * FROM pilot_stats_cache WHERE name = ? COLLATE NOCASE').get(name);

        const key = pilotKey(name);
        const gameRows = startDate
            ? pilotGamesHotSince.all({ name, startDate })
            : pilotGamesHotFirst(name);

        if (!gameRows || gameRows.length === 0) {
            return startDate ? null : (cached || null);
        }

        const record = { wins: 0, losses: 0, ties: 0 };
        let totalDamageDealt = 0;
        let totalDamageTaken = 0;
        let totalPlaytimeSec = 0;
        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        let suicides = 0;
        let validGames = 0;
        let lastSeen = null;
        const mapCounts = {};
        const weaponAgg = {};
        const weaponTakenAgg = {};

        for (const row of gameRows) {
            if (!row.details) continue;
            let g;
            try {
                g = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
            } catch {
                continue;
            }

            const players = g.players || [];
            const me = players.find(p => pilotKey(p?.name) === key);
            if (!me) continue;

            const durationSec = durationOf(g);

            if (!rankedMatch(g, durationSec)) continue;

            // Mode filter if requested
            if (matchMode && matchMode.toUpperCase() !== 'ALL') {
                const gMode = (g.settings?.matchMode || '').toUpperCase().replace(/[\s_]+/g, '');
                const reqMode = matchMode.toUpperCase().replace(/[\s_]+/g, '');
                if (gMode !== reqMode) continue;
            }

            validGames++;
            totalKills += netKills(me);
            totalDeaths += (me.deaths || 0);
            totalAssists += (me.assists || 0);
            totalPlaytimeSec += durationSec;

            if (row.date && (!lastSeen || row.date > lastSeen)) {
                lastSeen = row.date;
            }

            const mapName = g.settings?.level;
            if (mapName) {
                mapCounts[mapName] = (mapCounts[mapName] || 0) + 1;
            }

            const outcome = outcomeOf(g, me);
            if (outcome) record[OUTCOME_FIELD[outcome]]++;

            if (Array.isArray(g.damage)) {
                for (const d of g.damage) {
                    if (!d || !d.damage) continue;
                    const isAttacker = pilotKey(d.attacker) === key;
                    const isDefender = pilotKey(d.defender) === key;

                    if (isAttacker && !isDefender) {
                        totalDamageDealt += d.damage;
                        const wName = normalizeWeaponName(d.weapon);
                        if (!weaponAgg[wName]) {
                            weaponAgg[wName] = { name: wName, damage: 0, hits: 0, kills: 0 };
                        }
                        weaponAgg[wName].damage += d.damage;
                        weaponAgg[wName].hits += 1;
                    }
                    if (isDefender && !isAttacker) {
                        totalDamageTaken += d.damage;
                        const wName = normalizeWeaponName(d.weapon);
                        if (!weaponTakenAgg[wName]) {
                            weaponTakenAgg[wName] = { name: wName, damage: 0, hits: 0, deaths: 0 };
                        }
                        weaponTakenAgg[wName].damage += d.damage;
                        weaponTakenAgg[wName].hits += 1;
                    }
                }
            }

            if (Array.isArray(g.kills)) {
                for (const k of g.kills) {
                    if (!k) continue;
                    const isAttacker = pilotKey(k.attacker) === key;
                    const isDefender = pilotKey(k.defender) === key;
                    if (isAttacker && isDefender) {
                        suicides++;
                    }
                    if (isAttacker && !isDefender) {
                        const wName = normalizeWeaponName(k.weapon);
                        if (!weaponAgg[wName]) {
                            weaponAgg[wName] = { name: wName, damage: 0, hits: 0, kills: 0 };
                        }
                        weaponAgg[wName].kills += 1;
                    }
                    if (isDefender && !isAttacker) {
                        const wName = normalizeWeaponName(k.weapon);
                        if (!weaponTakenAgg[wName]) {
                            weaponTakenAgg[wName] = { name: wName, damage: 0, hits: 0, deaths: 0 };
                        }
                        weaponTakenAgg[wName].deaths += 1;
                    }
                }
            }
        }

        const totalGames = validGames;
        const flightMinutes = totalPlaytimeSec > 0 ? totalPlaytimeSec / 60 : 0;
        const { wins, losses, ties } = record;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 10 : 0;
        const pureKd = totalDeaths > 0 ? Math.round((totalKills / totalDeaths) * 100) / 100 : totalKills;
        const kda = combatRatio(totalKills, totalAssists, totalDeaths);
        const kpm = lethality(totalKills, totalPlaytimeSec);
        const aci = totalGames > 0 ? Math.round(((totalKills + totalAssists * 0.5 - totalDeaths) / totalGames) * 100) / 100 : 0;
        const dpm = flightMinutes > 0 ? Math.round((totalDamageDealt / flightMinutes)) : 0;
        const flightHours = Math.round((totalPlaytimeSec / 3600) * 10) / 10;

        // Defensive Damage Stats
        const damageTakenPerDeath = totalDeaths > 0 ? Math.round((totalDamageTaken / totalDeaths) * 10) / 10 : Math.round(totalDamageTaken * 10) / 10;
        const netDamage = Math.round(totalDamageDealt - totalDamageTaken);
        const netDpm = flightMinutes > 0 ? Math.round((totalDamageDealt - totalDamageTaken) / flightMinutes) : 0;

        let favoriteMap = 'Unknown';
        let maxMapGames = 0;
        for (const [m, count] of Object.entries(mapCounts)) {
            if (count > maxMapGames) {
                maxMapGames = count;
                favoriteMap = m;
            }
        }

        const weaponList = Object.values(weaponAgg)
            .filter(w => w.name !== 'Miscellaneous')
            .map(w => ({
                ...w,
                damage: Math.round(w.damage),
                isPrimary: PRIMARY_WEAPONS.has(w.name)
            }))
            .sort((a, b) => b.damage - a.damage);

        let primaryDamage = 0;
        let secondaryDamage = 0;
        for (const w of weaponList) {
            if (w.isPrimary) primaryDamage += w.damage;
            else secondaryDamage += w.damage;
        }
        const combinedDmg = (primaryDamage + secondaryDamage) || 1;
        for (const w of weaponList) {
            w.pctOfTotalDamage = Math.round((w.damage / combinedDmg) * 1000) / 10;
        }

        // Damage Taken Weapon Breakdown
        const weaponTakenList = Object.values(weaponTakenAgg)
            .filter(w => w.name !== 'Miscellaneous')
            .map(w => ({
                ...w,
                damage: Math.round(w.damage),
                isPrimary: PRIMARY_WEAPONS.has(w.name)
            }))
            .sort((a, b) => b.damage - a.damage);

        let primaryDamageTaken = 0;
        let secondaryDamageTaken = 0;
        for (const w of weaponTakenList) {
            if (w.isPrimary) primaryDamageTaken += w.damage;
            else secondaryDamageTaken += w.damage;
        }
        const combinedDmgTaken = (primaryDamageTaken + secondaryDamageTaken) || 1;
        for (const w of weaponTakenList) {
            w.pctOfTotalDamage = Math.round((w.damage / combinedDmgTaken) * 1000) / 10;
        }

        const favoriteWeapon = weaponList[0]?.name || 'Unknown';

        return {
            name,
            games: totalGames,
            kills: Math.max(0, totalKills),
            deaths: totalDeaths,
            assists: totalAssists,
            suicides,
            last_seen: lastSeen || cached?.last_updated || 'Unknown',
            favorite_map: favoriteMap,
            favorite_weapon: favoriteWeapon,
            pure_kd: pureKd,
            kda,
            wins,
            losses,
            ties,
            win_rate: winRate,
            flight_time_seconds: Math.round(totalPlaytimeSec),
            flight_hours: flightHours,
            kpm,
            aci,
            total_damage_dealt: Math.round(totalDamageDealt),
            total_damage_taken: Math.round(totalDamageTaken),
            dpm,
            damage_taken_per_death: damageTakenPerDeath,
            net_damage: netDamage,
            net_dpm: netDpm,
            threat_centrality: cached?.threat_centrality ?? 0,
            dominance_index: cached?.dominance_index ?? 50.0,
            // Career all-time numbers from registry cache
            career_games: cached ? cached.games : totalGames,
            career_kills: cached ? Math.max(0, cached.kills) : Math.max(0, totalKills),
            career_deaths: cached ? cached.deaths : totalDeaths,
            career_assists: cached ? cached.assists : totalAssists,
            career_suicides: cached ? (cached.suicides || 0) : suicides,
            career_wins: cached ? cached.wins : wins,
            career_losses: cached ? cached.losses : losses,
            career_ties: cached ? cached.ties : ties,
            career_win_rate: cached ? cached.win_rate : winRate,
            career_kd: cached ? Math.max(0, cached.kd) : pureKd,
            career_kda: cached ? Math.max(0, cached.kda) : kda,
            career_flight_hours: cached ? (cached.flight_hours || Math.round(((cached.time_played_seconds || 0) / 3600) * 10) / 10) : flightHours,
            recent_games: totalGames,
            timeframe_days: startDate ? 365 : null,
            mode_filter: matchMode || null,
            weapons: weaponList,
            weapon_summary: {
                primaryDamage: Math.round(primaryDamage),
                secondaryDamage: Math.round(secondaryDamage),
                primaryPct: Math.round((primaryDamage / combinedDmg) * 1000) / 10,
                secondaryPct: Math.round((secondaryDamage / combinedDmg) * 1000) / 10,
                totalDamage: Math.round(totalDamageDealt)
            },
            damage_taken_weapons: weaponTakenList,
            damage_taken_summary: {
                primaryDamage: Math.round(primaryDamageTaken),
                secondaryDamage: Math.round(secondaryDamageTaken),
                primaryPct: Math.round((primaryDamageTaken / combinedDmgTaken) * 1000) / 10,
                secondaryPct: Math.round((secondaryDamageTaken / combinedDmgTaken) * 1000) / 10,
                totalDamage: Math.round(totalDamageTaken)
            }
        };
    } catch (err) {
        console.error("Failed in getPilotTelemetry:", err);
        return null;
    }
}

export const getPilotDetailedStats = {
    get: ({ name, startDate, mode }) => getPilotTelemetry(name, startDate, mode)
};

export const getPilotBreakdown = (name) => {
  try {
    const key = pilotKey(name);
    // Cold games only if hot games have very few matches (e.g. historical pilot)
    const allRows = pilotGamesHotFirst(name);

    const mapMap = new Map();
    const rivalMap = new Map();

    for (let i = 0; i < allRows.length; i++) {
      let g;
      try {
        g = typeof allRows[i].details === 'string' ? JSON.parse(allRows[i].details) : allRows[i].details;
      } catch {
        continue;
      }
      const players = g.players || [];
      const me = players.find(p => pilotKey(p?.name) === key);
      if (!me) continue;

      const map = g.settings?.level;
      if (map) {
        let m = mapMap.get(map);
        if (!m) {
          m = { map, games: 0, kills: 0, deaths: 0, assists: 0 };
          mapMap.set(map, m);
        }
        m.games++;
        m.kills += netKills(me);
        m.deaths += (me.deaths || 0);
        m.assists += (me.assists || 0);
      }

      const result = winnerOf(g);

      for (let j = 0; j < players.length; j++) {
        const other = players[j];
        const otherKey = pilotKey(other?.name);
        if (!otherKey || otherKey === key) continue;
        let r = rivalMap.get(otherKey);
        if (!r) {
          r = {
            name: other.name,
            encounters: 0,
            your_kills: 0,
            their_kills: 0,
            your_wins: 0,
            their_wins: 0,
            ties: 0,
            their_deaths: 0
          };
          rivalMap.set(otherKey, r);
        }
        r.encounters++;
        r.their_deaths += (other.deaths || 0);

        const outcome = pairOutcome(g, me, other, result);
        if (outcome === 'win') r.your_wins++;
        else if (outcome === 'loss') r.their_wins++;
        else if (outcome === 'tie') r.ties++;
      }

      // Direct kills exchanged between me and rivals
      if (Array.isArray(g.kills)) {
        for (const k of g.kills) {
          if (!k || !k.attacker || !k.defender) continue;
          const att = pilotKey(k.attacker);
          const def = pilotKey(k.defender);
          if (att === key && def !== key) {
            const r = rivalMap.get(def);
            if (r) r.your_kills++;
          } else if (def === key && att !== key) {
            const r = rivalMap.get(att);
            if (r) r.their_kills++;
          }
        }
      }
    }

    const mapStats = Array.from(mapMap.values())
      .sort((a, b) => b.games - a.games)
      .slice(0, 6)
      .map(m => ({
        ...m,
        kd: m.kills / Math.max(1, m.deaths)
      }));

    const getRivalStatsStmt = hotDb.prepare(`
      SELECT kd, kda, win_rate, flight_hours, threat_centrality, dominance_index
      FROM pilot_stats_cache
      WHERE name = ? COLLATE NOCASE
    `);

    const rivals = Array.from(rivalMap.values())
      .sort((a, b) => b.encounters - a.encounters)
      .slice(0, 9)
      .map(r => {
        let s = null;
        try {
          s = getRivalStatsStmt.get(r.name);
        } catch {}
        return {
          ...r,
          h2h_kd: r.their_kills > 0 ? Math.round((r.your_kills / r.their_kills) * 100) / 100 : r.your_kills,
          their_kd: r.their_kills > 0 ? Math.round((r.their_kills / Math.max(1, r.your_kills)) * 100) / 100 : 0,
          kd: s?.kd ?? (r.their_deaths > 0 ? Math.round((r.their_kills / r.their_deaths) * 100) / 100 : 1.0),
          kda: s?.kda ?? (s?.kd ?? 1.0),
          win_rate: s?.win_rate ?? 0,
          flight_hours: s?.flight_hours ?? 0,
          threat_centrality: s?.threat_centrality ?? 0,
          dominance_index: s?.dominance_index ?? 0
        };
      });

    return { mapStats, rivals };
  } catch (err) {
    console.error("Failed to get pilot breakdown", err);
    return { mapStats: [], rivals: [] };
  }
};
