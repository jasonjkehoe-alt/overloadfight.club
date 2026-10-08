// Fixture games for the DB tests, read from the two sample files at the repo root.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readFixture = file => JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
export const sample = readFixture('gamelist_sample.json').games;
export const detailSample = readFixture('game_detail_sample.json');
export const byId = id => structuredClone(sample.find(g => g.id === id));

// The 2019 Monsterball detail sample (cold storage age) with RONCLI, who killed
// himself once, renamed "Soup" in the players and the kill log.
const asSoup = name => (name === 'RONCLI' ? 'Soup' : name);
export const veteranSoup = {
    ...detailSample,
    id: 2,
    players: detailSample.players.map(p => ({ ...p, name: asSoup(p.name) })),
    kills: detailSample.kills.map(k => ({ ...k, attacker: asSoup(k.attacker), defender: asSoup(k.defender) }))
};

// The sample games were all played on 2025-11-24 (UTC). Move them to a recent
// day so saveGames files them in hot storage whatever today's date is.
export const day = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
const shift = Date.parse(`${day}T00:00:00Z`) - Date.parse('2025-11-24T00:00:00Z');
const moved = iso => new Date(Date.parse(iso) + shift).toISOString();
export const onDay = game => ({ ...game, date: moved(game.date), settings: { ...game.settings, start: moved(game.settings.start) } });

// The samples carry no kill logs (the detail sample has one suicide), so the
// kill-log tests use fixture games with a log written to reproduce their
// players' kills, deaths and assists and their team score.
//
// 72099, TEAM ANARCHY, BLUE 6-4 ORANGE (PHOENIX, INSANER BLUE; STITCH, MAESTRO
// ORANGE). First blood STITCH at 0:10; the lead goes BLUE at 0:40, ORANGE at
// 1:10, BLUE at 2:30. Half the entries leave out the teams, which then come
// from the players.
const kill = (time, attacker, defender, weapon, extra = {}) => ({ time, attacker, defender, weapon, ...extra });
export const teamWithLog = {
    ...byId(72099),
    kills: [
        kill(10, 'STITCH', 'PHOENIX', 'Impulse', { attackerTeam: 'ORANGE', defenderTeam: 'BLUE' }),
        kill(25, 'INSANER', 'MAESTRO', 'Thunderbolt', { assisted: 'PHOENIX', attackerTeam: 'BLUE', defenderTeam: 'ORANGE', assistedTeam: 'BLUE' }),
        kill(40, 'INSANER', 'STITCH', 'Flak'),
        kill(55, 'STITCH', 'INSANER', 'Falcon', { attackerTeam: 'ORANGE', defenderTeam: 'BLUE' }),
        kill(70, 'MAESTRO', 'PHOENIX', 'Creeper'),
        kill(90, 'STITCH', 'PHOENIX', 'Missile Pod', { attackerTeam: 'ORANGE', defenderTeam: 'BLUE' }),
        kill(110, 'INSANER', 'MAESTRO', 'Driller'),
        kill(130, 'INSANER', 'MAESTRO', 'Nova', { attackerTeam: 'BLUE', defenderTeam: 'ORANGE' }),
        kill(150, 'PHOENIX', 'STITCH', 'Reflex'),
        kill(180, 'INSANER', 'MAESTRO', 'Miscellaneous', { attackerTeam: 'BLUE', defenderTeam: 'ORANGE' })
    ]
};

// 72098, ANARCHY, JFTP and "." both on 2: "." goes ahead at 0:45 (one lead
// change), JFTP levels at 1:20 and the match is a draw.
export const ffaWithLog = {
    ...byId(72098),
    kills: [
        kill(12, 'JFTP', '.', 'Impulse'),
        kill(30, '.', 'JFTP', 'Hunter'),
        kill(45, '.', 'JFTP', 'Thunderbolt'),
        kill(80, 'JFTP', '.', 'Lancer')
    ]
};
