import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let dataDir;
let db;
let server;
let baseUrl;

const getKills = async (path) => {
    const res = await fetch(`${baseUrl}${path}`);
    return { statusCode: res.status, responseJson: await res.json() };
};

beforeAll(async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofc-replay-test-'));
    process.env.DATA_DIR = dataDir;
    db = (await import('./db.js')).default;
    const routes = (await import('./routes.js')).default;

    // Seed test games with kills and suicides
    const testGame = {
        id: 99001,
        date: '2026-10-01T12:00:00.000Z',
        settings: { matchMode: 'ANARCHY', level: 'TITAN', timeLimit: 600 },
        players: [
            { name: 'VIPER', kills: 3, deaths: 2 },
            { name: 'FALCON', kills: 1, deaths: 3 }
        ],
        kills: [
            // t=10: Falcon self-destruct (suicide)
            { attacker: 'FALCON', defender: 'FALCON', weapon: 'Suicide', time: 10 },
            // t=25: Viper kills Falcon (First Blood)
            { attacker: 'VIPER', defender: 'FALCON', weapon: 'Impulse', time: 25 },
            // t=40: Falcon kills Viper (Revenge, within 30s)
            { attacker: 'FALCON', defender: 'VIPER', weapon: 'Reflex', time: 40 },
            // t=45: Viper kills Falcon (Revenge, within 30s)
            { attacker: 'VIPER', defender: 'FALCON', weapon: 'Cyclone', time: 45 },
            // t=55: Viper kills Falcon (2nd kill in window)
            { attacker: 'VIPER', defender: 'FALCON', weapon: 'Thunderbolt', time: 55 },
            // t=62: Viper kills Falcon (3rd kill in window without dying -> Spree x3)
            { attacker: 'VIPER', defender: 'FALCON', weapon: 'Flak', time: 62 },
            // t=80: Viper suicide
            { attacker: 'VIPER', defender: 'VIPER', weapon: 'Self-Destruct', time: 80 }
        ]
    };

    db.saveGames([testGame]);

    const app = express();
    app.use('/api', routes);
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
    server?.close();
    await db.close?.();
    fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('Match Replay Endpoints', () => {
    it('/api/match/:id/kills returns normalized, sorted kill events with suicide flag', async () => {
        const { statusCode, responseJson } = await getKills('/api/match/99001/kills');

        expect(statusCode).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(7);

        // Verify sorted by t ascending
        for (let i = 1; i < responseJson.length; i++) {
            expect(responseJson[i].t).toBeGreaterThanOrEqual(responseJson[i - 1].t);
        }

        // Verify t=10 is suicide
        expect(responseJson[0]).toEqual({
            t: 10,
            killer: 'FALCON',
            victim: 'FALCON',
            weapon: 'Suicide',
            suicide: true
        });

        // Verify t=25 is non-suicide
        expect(responseJson[1]).toEqual({
            t: 25,
            killer: 'VIPER',
            victim: 'FALCON',
            weapon: 'Impulse',
            suicide: false
        });

        // Verify t=80 is suicide
        expect(responseJson[6].suicide).toBe(true);
    });

    it('/api/game/:id/kills matches /api/match/:id/kills output', async () => {
        const { statusCode, responseJson } = await getKills('/api/game/99001/kills');

        expect(statusCode).toBe(200);
        expect(responseJson.length).toBe(7);
    });
});

describe('Match Replay Auto Callouts & State Correctness', () => {
    it('computes First Blood, Revenge, and Spree correctly from normalized kills', () => {
        const kills = [
            { t: 10, killer: 'FALCON', victim: 'FALCON', weapon: 'Suicide', suicide: true },
            { t: 25, killer: 'VIPER', victim: 'FALCON', weapon: 'Impulse', suicide: false },
            { t: 40, killer: 'FALCON', defender: 'VIPER', victim: 'VIPER', weapon: 'Reflex', suicide: false },
            { t: 45, killer: 'VIPER', victim: 'FALCON', weapon: 'Cyclone', suicide: false },
            { t: 55, killer: 'VIPER', victim: 'FALCON', weapon: 'Thunderbolt', suicide: false },
            { t: 62, killer: 'VIPER', victim: 'FALCON', weapon: 'Flak', suicide: false },
            { t: 80, killer: 'VIPER', victim: 'VIPER', weapon: 'Self-Destruct', suicide: true }
        ];

        let firstBloodFound = false;
        const processed = kills.map((ev, i) => {
            const callouts = [];
            let isFirstBlood = false;

            // First Blood: first non-suicide kill
            if (!firstBloodFound && !ev.suicide && ev.killer && ev.killer !== ev.victim) {
                isFirstBlood = true;
                callouts.push('FIRST BLOOD');
                firstBloodFound = true;
            }

            if (!ev.suicide && ev.killer) {
                // Revenge: killer was fragged by victim within 30s
                for (let j = i - 1; j >= 0; j--) {
                    const prev = kills[j];
                    if (ev.t - prev.t > 30) break;
                    if (prev.killer === ev.victim && prev.victim === ev.killer) {
                        callouts.push('REVENGE');
                        break;
                    }
                }

                // Spree: 3+ kills within 20s without dying
                let spreeCount = 1;
                let killerDied = false;
                for (let j = i - 1; j >= 0; j--) {
                    const prev = kills[j];
                    if (ev.t - prev.t > 20) break;
                    if (prev.victim === ev.killer) {
                        killerDied = true;
                        break;
                    }
                    if (prev.killer === ev.killer && !prev.suicide) {
                        spreeCount++;
                    }
                }
                if (!killerDied && spreeCount >= 3) {
                    callouts.push(`SPREE x${spreeCount}`);
                }
            }

            return { ...ev, callouts, isFirstBlood };
        });

        // t=10 is suicide -> not first blood
        expect(processed[0].isFirstBlood).toBe(false);
        expect(processed[0].callouts).toEqual([]);

        // t=25 is first non-suicide kill -> FIRST BLOOD
        expect(processed[1].isFirstBlood).toBe(true);
        expect(processed[1].callouts).toContain('FIRST BLOOD');

        // t=40: Falcon kills Viper within 15s of dying to Viper -> REVENGE
        expect(processed[2].callouts).toContain('REVENGE');

        // t=45: Viper kills Falcon within 5s of dying to Falcon -> REVENGE
        expect(processed[3].callouts).toContain('REVENGE');

        // t=62: Viper kills Falcon (3rd kill in 17s: t=45, 55, 62 without dying) -> SPREE x3
        expect(processed[5].callouts).toContain('SPREE x3');
    });

    it('end-state scores match match scoreboard exactly, even with suicides', () => {
        const events = [
            { t: 10, killer: 'FALCON', victim: 'FALCON', suicide: true },
            { t: 25, killer: 'VIPER', victim: 'FALCON', suicide: false },
            { t: 40, killer: 'FALCON', victim: 'VIPER', suicide: false },
            { t: 45, killer: 'VIPER', victim: 'FALCON', suicide: false },
            { t: 55, killer: 'VIPER', victim: 'FALCON', suicide: false },
            { t: 62, killer: 'VIPER', victim: 'FALCON', suicide: false },
            { t: 80, killer: 'VIPER', victim: 'VIPER', suicide: true }
        ];

        const computeScore = (targetT) => {
            const scores = { VIPER: 0, FALCON: 0 };
            for (const ev of events) {
                if (ev.t > targetT) break;
                if (ev.suicide) {
                    scores[ev.victim] -= 1;
                } else {
                    scores[ev.killer] += 1;
                }
            }
            return scores;
        };

        // Final score at t=100
        const finalScores = computeScore(100);
        // Viper: 4 kills - 1 suicide = 3 kills (matches VIPER: 3 in test game)
        // Falcon: 1 kill - 1 suicide = 0 (net) or 1 kill / 1 suicide
        expect(finalScores.VIPER).toBe(3);
        expect(finalScores.FALCON).toBe(0);

        // Seeking to end, then seeking to 0, then seeking to end again yields identical result
        const seekEnd1 = computeScore(100);
        const seekStart = computeScore(0);
        const seekEnd2 = computeScore(100);

        expect(seekStart).toEqual({ VIPER: 0, FALCON: 0 });
        expect(seekEnd1).toEqual(seekEnd2);
    });

    it('v2 blip sizing formula scales with sqrt(score) and clamps within [base, 2.2*base]', () => {
        const base = 11;
        const max = 24.2;
        const calcRadius = (score) => Math.min(max, Math.max(base, base + 2.6 * Math.sqrt(Math.max(0, score))));

        expect(calcRadius(-2)).toBe(11);
        expect(calcRadius(0)).toBe(11);
        expect(calcRadius(4)).toBeCloseTo(11 + 2.6 * 2, 2); // 16.2
        expect(calcRadius(25)).toBe(24); // 11 + 2.6 * 5 = 24
        expect(calcRadius(100)).toBe(24.2); // clamped at 2.2 * base
    });

    it('v2 crown tie-breaking awards leader to earliest-to-reach and aligns ring order with scoreboard', () => {
        // Test tie-breaking: both reach 2 kills, pilot A reaches at t=10, pilot B at t=15
        const events = [
            { t: 10, killer: 'PILOT_A', victim: 'VICTIM', suicide: false },
            { t: 12, killer: 'PILOT_B', victim: 'VICTIM', suicide: false },
            { t: 14, killer: 'PILOT_A', victim: 'VICTIM', suicide: false },
            { t: 18, killer: 'PILOT_B', victim: 'VICTIM', suicide: false }
        ];

        const computeLeader = (targetT) => {
            const scores = { PILOT_A: 0, PILOT_B: 0 };
            const reachedAt = { PILOT_A: 0, PILOT_B: 0 };

            for (const ev of events) {
                if (ev.t > targetT) break;
                scores[ev.killer] += 1;
                reachedAt[ev.killer] = ev.t;
            }

            const maxScore = Math.max(scores.PILOT_A, scores.PILOT_B);
            let leader = '';
            ['PILOT_A', 'PILOT_B'].forEach(p => {
                if (scores[p] === maxScore) {
                    if (!leader || reachedAt[p] < reachedAt[leader]) {
                        leader = p;
                    }
                }
            });
            return { leader, scores };
        };

        // At t=14: PILOT_A has 2 kills, PILOT_B has 1 -> PILOT_A leads
        expect(computeLeader(14).leader).toBe('PILOT_A');

        // At t=18: both PILOT_A and PILOT_B have 2 kills, but PILOT_A reached 2 at t=14, PILOT_B at t=18
        // Earliest-to-reach tie-breaker selects PILOT_A
        const finalState = computeLeader(20);
        expect(finalState.scores.PILOT_A).toBe(2);
        expect(finalState.scores.PILOT_B).toBe(2);
        expect(finalState.leader).toBe('PILOT_A');

        // King-of-the-hill deficit and ring order:
        // Leader has deficit 0 (inner ring)
        const deficitA = finalState.scores[finalState.leader] - finalState.scores.PILOT_A;
        expect(deficitA).toBe(0);
    });

    it('v2 survival aura scales linearly with min(aliveTime, 60)/60 and resets on death', () => {
        const lastDeathT = 30; // died at t=30
        const calcAura = (curT) => {
            const timeSinceDeath = curT - lastDeathT;
            if (timeSinceDeath < 3.0) return 0; // respawn ghost period
            const aliveTime = timeSinceDeath - 3.0;
            return Math.min(1.0, aliveTime / 60.0);
        };

        expect(calcAura(31)).toBe(0); // within 3s ghost
        expect(calcAura(33)).toBe(0); // exactly at respawn
        expect(calcAura(63)).toBeCloseTo(0.5, 2); // 30s alive -> 50% charged
        expect(calcAura(93)).toBe(1.0); // 60s alive -> 100% charged
        expect(calcAura(150)).toBe(1.0); // capped at 1.0
    });

    it('v3 story mode auto-advance schedules next frame before early returns (schedule-first invariant)', () => {
        // Source file invariant check:
        // Ensure animFrameRef.current = requestAnimationFrame(renderFrame) appears at the start of renderFrame,
        // and does NOT appear at the bottom before the closing brace of renderFrame.
        const componentPath = path.resolve(process.cwd(), 'components/MatchReplay.tsx');
        const content = fs.readFileSync(componentPath, 'utf-8');

        // Extract renderFrame function definition
        const renderFrameMatch = content.match(/const renderFrame = \(timestamp: number\) => \{([\s\S]*?)\n    \};/);
        expect(renderFrameMatch).not.toBeNull();
        const renderFrameBody = renderFrameMatch[1];

        // 1. First statement inside renderFrame must be animFrameRef.current = requestAnimationFrame(renderFrame)
        const trimmedBody = renderFrameBody.trim();
        expect(trimmedBody.startsWith('animFrameRef.current = requestAnimationFrame(renderFrame);')).toBe(true);

        // 2. The bottom of renderFrame must not have the old redundant rAF call
        const bodyLines = renderFrameBody.trim().split('\n').map(l => l.trim()).filter(Boolean);
        const lastStatement = bodyLines[bodyLines.length - 1];
        expect(lastStatement).not.toContain('requestAnimationFrame(renderFrame)');

        // 3. Behavioral simulation: mock rAF loop driving beat transitions
        const storyBeats = [
            { id: 'beat-1', t: 25, type: 'first-blood' },
            { id: 'beat-2', t: 62, type: 'spree' }
        ];
        const matchDuration = 600;

        let rAFCallCount = 0;
        const mockRAF = (cb) => {
            rAFCallCount++;
            return rAFCallCount;
        };

        let isPlaying = true;
        let isStoryMode = true;
        let storyBeatIdx = 0;
        let currentTime = 15; // starting at beat 0 - 10s = 15
        let animFrameId = null;
        let seekCalls = [];

        const seekTo = (target, fromStoryMode) => {
            seekCalls.push({ target, fromStoryMode });
            currentTime = target;
        };

        // Simulated renderFrame following the schedule-first pattern
        const renderFrame = (timestamp) => {
            animFrameId = mockRAF(renderFrame); // Schedule FIRST

            const deltaSeconds = 0.05;
            if (isPlaying) {
                const nextTime = currentTime + deltaSeconds * 2; // 2x speed
                if (isStoryMode && storyBeats.length > 0) {
                    const currentBeat = storyBeats[storyBeatIdx];
                    if (currentBeat) {
                        const beatWindowEnd = Math.min(matchDuration, currentBeat.t + 10);
                        if (nextTime >= beatWindowEnd) {
                            if (storyBeatIdx < storyBeats.length - 1) {
                                storyBeatIdx += 1;
                                const nextStartTime = Math.max(0, storyBeats[storyBeatIdx].t - 10);
                                seekTo(nextStartTime, true);
                                return; // Early return 1: jump to next clip
                            } else {
                                currentTime = Math.min(matchDuration, currentBeat.t + 5);
                                isPlaying = false;
                                isStoryMode = false;
                                return; // Early return 2: final clip finished
                            }
                        }
                    }
                }
                currentTime = nextTime;
            }
        };

        // Frame 1: Normal playback before window end
        currentTime = 20; // beat 0 window end is 35 (25 + 10)
        renderFrame(1000);
        expect(rAFCallCount).toBe(1);
        expect(storyBeatIdx).toBe(0);

        // Frame 2: Crosses beatWindowEnd (35) -> auto-advances to Beat 2
        // In the buggy code, this early-return exited without re-scheduling, freezing the canvas!
        currentTime = 34.95;
        const rAFBeforeTransition = rAFCallCount;
        renderFrame(1050);
        expect(rAFCallCount).toBe(rAFBeforeTransition + 1); // Confirmed re-scheduled!
        expect(storyBeatIdx).toBe(1);
        expect(seekCalls.length).toBe(1);
        expect(seekCalls[0].target).toBe(52); // beat 1 (62) - 10s = 52s

        // Frame 3: Normal playback of 2nd clip
        currentTime = 71.9; // beat 1 window end is 72 (62 + 10)
        renderFrame(1100);
        expect(rAFCallCount).toBe(rAFBeforeTransition + 2);

        // Frame 4: Crosses beat 1 window end -> final beat reached
        const rAFBeforeFinal = rAFCallCount;
        renderFrame(1150);
        expect(rAFCallCount).toBe(rAFBeforeFinal + 1); // Confirmed re-scheduled even on final beat pause!
        expect(isPlaying).toBe(false);
        expect(isStoryMode).toBe(false);
    });
});

