import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GameData, KillEvent, PlayerData } from '../types';
// The page's one copy of the kill-log rules and weapon colours (S12).
import { killPoints, leadChanges, replayLengthOf, weaponFamily } from '../server/lib/gameParse.js';
import { chart } from '../designTokens.js';

export interface MatchReplayProps {
  game: GameData;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  mapImage?: string | null;
}

interface NormalizedKill {
  id: number;
  t: number; // seconds
  killer: string;
  victim: string;
  weapon: string;
  suicide: boolean;
  killerTeam?: string;
  victimTeam?: string;
  callouts: string[];
  isFirstBlood: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface StoryBeat {
  id: string;
  t: number; // seconds
  type: 'first-blood' | 'lead-change' | 'spree' | 'final-minute';
  label: string;
  description: string;
}

// Distinct, vibrant color palette for FFA pilots
const FFA_PALETTE = [
  '#00d4ff', // Electric cyan
  '#ff3366', // Neon red/magenta
  '#39ff14', // Neon green
  '#ffaa00', // Neon amber
  '#b026ff', // Electric purple
  '#ffff00', // Neon yellow
  '#ff6600', // Overload orange
  '#00ffcc', // Mint turquoise
  '#e056fd', // Orchid pink
  '#f0932b', // Sunburst
  '#38bdf8', // Sky blue
  '#ec4899', // Hot pink
  '#10b981', // Emerald
  '#a855f7'  // Violet
];

// Weapon tracer color mapping: the weapon family's chart colour, as on the momentum chart
function getWeaponColor(weapon: string): string {
  return chart.weapon[weaponFamily(weapon)];
}

function formatTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const MatchReplay: React.FC<MatchReplayProps> = ({ game, initialTime = 0, onTimeUpdate, mapImage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [hoveredEvent, setHoveredEvent] = useState<{ event: NormalizedKill; x: number } | null>(null);
  const [hoveredBeat, setHoveredBeat] = useState<{ beat: StoryBeat; x: number } | null>(null);
  const [hoveredPilotName, setHoveredPilotName] = useState<string | null>(null);

  // Story Mode & Theater Mode states
  const [isStoryMode, setIsStoryMode] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(initialTime);
  const isPlayingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(playbackSpeed);
  const isStoryModeRef = useRef<boolean>(false);
  const storyBeatIndexRef = useRef<number>(0);

  // Scrubber drag state
  const isDraggingScrubberRef = useRef<boolean>(false);

  // Visual simulation state refs
  const particlesRef = useRef<Particle[]>([]);
  const orbitRadiiRef = useRef<Record<string, number>>({});
  const trailsRef = useRef<Record<string, Array<{ x: number; y: number }>>>({});
  const pointsPerRingRef = useRef<number>(1);
  const lastBreakpointRef = useRef<number>(-1);
  const lastRenderedKillsRef = useRef<Set<number>>(new Set());

  // Throttling ref for high-speed (>= 8x) ticker updates
  const lastTickerTimeUpdateRef = useRef<number>(0);

  // Offscreen pre-rendered arena backdrop canvas
  const backdropCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state with refs
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    isStoryModeRef.current = isStoryMode;
  }, [isStoryMode]);

  // Pre-render map backdrop texture asynchronously once to offscreen canvas
  useEffect(() => {
    if (!mapImage) {
      backdropCanvasRef.current = null;
      return;
    }

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (isCancelled) return;
      try {
        const offscreen = document.createElement('canvas');
        const size = 800; // ample resolution for circular arena texture
        offscreen.width = size;
        offscreen.height = size;
        const offCtx = offscreen.getContext('2d');
        if (!offCtx) return;

        // Desaturate, darken to theme, blur ~8px
        offCtx.filter = 'grayscale(100%) brightness(28%) contrast(125%) blur(8px)';

        // Cover-fit image into square canvas
        const hRatio = size / img.width;
        const vRatio = size / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const shiftX = (size - img.width * ratio) / 2;
        const shiftY = (size - img.height * ratio) / 2;

        offCtx.drawImage(img, 0, 0, img.width, img.height, shiftX, shiftY, img.width * ratio, img.height * ratio);

        // Reset filter before radial mask
        offCtx.filter = 'none';

        // Radial-mask to radar circle
        offCtx.globalCompositeOperation = 'destination-in';
        offCtx.beginPath();
        offCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        offCtx.fill();
        offCtx.globalCompositeOperation = 'source-over';

        backdropCanvasRef.current = offscreen;
      } catch {
        backdropCanvasRef.current = null;
      }
    };

    img.onerror = () => {
      backdropCanvasRef.current = null;
    };

    img.src = mapImage;

    return () => {
      isCancelled = true;
    };
  }, [mapImage]);

  // Fullscreen change listener for Theater mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement && document.fullscreenElement === containerRef.current);
      setIsTheaterMode(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 1. Check if game has kills; if none, don't render panel at all
  const rawKills = game?.kills;
  const hasKills = Boolean(rawKills && rawKills.length > 0);

  // Extract pilots and mode
  const isTeamMode = useMemo(() => {
    const mode = (game.settings?.matchMode || '').toLowerCase();
    const hasTeams = Boolean(game.players?.some(p => p.team === 'BLUE' || p.team === 'ORANGE'));
    return mode.includes('team') || hasTeams;
  }, [game]);

  const allPilotNames = useMemo(() => {
    const names = new Set<string>();
    if (game.players) {
      for (const p of game.players) {
        if (p.name) names.add(p.name);
      }
    }
    if (rawKills) {
      for (const k of rawKills) {
        if (k.attacker) names.add(k.attacker);
        if (k.defender) names.add(k.defender);
      }
    }
    return Array.from(names);
  }, [game, rawKills]);

  const pilotTeamMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (game.players) {
      for (const p of game.players) {
        if (p.team) map[p.name] = p.team.toUpperCase();
      }
    }
    if (rawKills) {
      for (const k of rawKills) {
        if (k.attacker && k.attackerTeam && !map[k.attacker]) map[k.attacker] = k.attackerTeam.toUpperCase();
        if (k.defender && k.defenderTeam && !map[k.defender]) map[k.defender] = k.defenderTeam.toUpperCase();
      }
    }
    return map;
  }, [game, rawKills]);

  const pilotColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allPilotNames.forEach((name, idx) => {
      const team = pilotTeamMap[name];
      if (isTeamMode && team === 'BLUE') {
        map[name] = '#3b82f6';
      } else if (isTeamMode && team === 'ORANGE') {
        map[name] = '#f97316';
      } else {
        map[name] = FFA_PALETTE[idx % FFA_PALETTE.length];
      }
    });
    return map;
  }, [allPilotNames, pilotTeamMap, isTeamMode]);

  // 2. Precompute sorted events with Auto Callouts (First Blood, Revenge, Spree)
  const normalizedEvents: NormalizedKill[] = useMemo(() => {
    if (!rawKills || rawKills.length === 0) return [];

    const sorted = [...rawKills]
      .map((k, idx) => {
        const killer = k.attacker || '';
        const victim = k.defender || '';
        const weapon = k.weapon || 'Unknown';
        const isSuicide = Boolean(
          (killer && victim && killer === victim) ||
          weapon === 'Suicide' ||
          weapon === 'Self-Destruct' ||
          !killer
        );
        return {
          id: idx,
          t: typeof k.time === 'number' ? k.time : parseFloat(String(k.time)) || 0,
          killer,
          victim,
          weapon,
          suicide: isSuicide,
          killerTeam: k.attackerTeam || pilotTeamMap[killer],
          victimTeam: k.defenderTeam || pilotTeamMap[victim],
          callouts: [] as string[],
          isFirstBlood: false
        };
      })
      .sort((a, b) => a.t - b.t);

    // Compute Auto Callouts
    let firstBloodFound = false;

    for (let i = 0; i < sorted.length; i++) {
      const ev = sorted[i];

      // First Blood: first non-suicide kill
      if (!firstBloodFound && !ev.suicide && ev.killer && ev.killer !== ev.victim) {
        ev.isFirstBlood = true;
        ev.callouts.push('FIRST BLOOD');
        firstBloodFound = true;
      }

      if (!ev.suicide && ev.killer) {
        // Revenge: pilot frags their killer within 30 seconds
        for (let j = i - 1; j >= 0; j--) {
          const prev = sorted[j];
          if (ev.t - prev.t > 30) break;
          if (prev.killer === ev.victim && prev.victim === ev.killer) {
            ev.callouts.push('REVENGE');
            break;
          }
        }

        // Spree: 3+ kills within 20 seconds without dying (label x3 / x4 / x5...)
        let spreeCount = 1;
        let killerDied = false;
        for (let j = i - 1; j >= 0; j--) {
          const prev = sorted[j];
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
          ev.callouts.push(`SPREE x${spreeCount}`);
        }
      }
    }

    return sorted;
  }, [rawKills, pilotTeamMap]);

  // Total match duration, the same span as the page's scrubber (300 s when nothing gives one)
  const matchDuration = useMemo(() => replayLengthOf(game) || 300, [game]);

  // Full score & match state calculation at timestamp t
  const getFullStateAtTime = useCallback(
    (t: number) => {
      const pilotScores: Record<string, number> = {};
      const scoreReachedAt: Record<string, number> = {};
      const lastDeathT: Record<string, number> = {};

      allPilotNames.forEach(name => {
        pilotScores[name] = 0;
        scoreReachedAt[name] = 0;
        lastDeathT[name] = 0;
      });

      const teamScores: Record<string, number> = { BLUE: 0, ORANGE: 0 };
      const teamScoreReachedAt: Record<string, number> = { BLUE: 0, ORANGE: 0 };

      for (const ev of normalizedEvents) {
        if (ev.t > t) break;

        // Death tracking
        lastDeathT[ev.victim] = ev.t;

        const { scorer, side, points } = killPoints(
          {
            attacker: ev.killer,
            defender: ev.victim,
            attackerTeam: ev.killerTeam || pilotTeamMap[ev.killer],
            defenderTeam: ev.victimTeam || pilotTeamMap[ev.victim]
          },
          isTeamMode
        );
        // scorer is ev.killer trimmed; the replay keys pilots by the name as logged
        if (scorer && pilotScores[ev.killer] !== undefined) {
          pilotScores[ev.killer] += points;
          scoreReachedAt[ev.killer] = ev.t;
        }
        if (isTeamMode && (side === 'BLUE' || side === 'ORANGE')) {
          teamScores[side] += points;
          teamScoreReachedAt[side] = ev.t;
        }
      }

      // Determine leader with tie-breaking (earliest to reach score wins tie)
      let leaderName = '';
      let maxScore = -Infinity;
      let leadingTeam = 'BLUE';

      if (isTeamMode) {
        if (teamScores.ORANGE > teamScores.BLUE) {
          leadingTeam = 'ORANGE';
        } else if (teamScores.BLUE === teamScores.ORANGE) {
          leadingTeam = teamScoreReachedAt.ORANGE < teamScoreReachedAt.BLUE ? 'ORANGE' : 'BLUE';
        }
        maxScore = teamScores[leadingTeam];

        let bestPilotScore = -Infinity;
        allPilotNames.forEach(p => {
          const s = pilotScores[p];
          if (s > bestPilotScore) {
            bestPilotScore = s;
            leaderName = p;
          } else if (s === bestPilotScore && scoreReachedAt[p] < scoreReachedAt[leaderName]) {
            leaderName = p;
          }
        });
      } else {
        // FFA leader
        allPilotNames.forEach(p => {
          const s = pilotScores[p];
          if (s > maxScore) {
            maxScore = s;
            leaderName = p;
          } else if (s === maxScore && leaderName) {
            if (scoreReachedAt[p] < scoreReachedAt[leaderName]) {
              leaderName = p;
            }
          } else if (!leaderName) {
            leaderName = p;
            maxScore = s;
          }
        });
      }

      // Calculate deficits
      const deficits: Record<string, number> = {};
      let maxDeficit = 0;

      if (isTeamMode) {
        const blueDeficit = Math.max(0, maxScore - teamScores.BLUE);
        const orangeDeficit = Math.max(0, maxScore - teamScores.ORANGE);
        maxDeficit = Math.max(blueDeficit, orangeDeficit);

        allPilotNames.forEach(p => {
          const team = pilotTeamMap[p];
          deficits[p] = team === 'ORANGE' ? orangeDeficit : blueDeficit;
        });
      } else {
        allPilotNames.forEach(p => {
          const d = Math.max(0, maxScore - pilotScores[p]);
          deficits[p] = d;
          if (d > maxDeficit) maxDeficit = d;
        });
      }

      return {
        pilotScores,
        teamScores,
        scoreReachedAt,
        lastDeathT,
        leaderName,
        leadingTeam,
        maxScore,
        deficits,
        maxDeficit
      };
    },
    [allPilotNames, normalizedEvents, isTeamMode, pilotTeamMap]
  );

  // Compute ringStep for King-of-the-hill radar at 30s breakpoint or seek
  const computeRingStepAtTime = useCallback(
    (t: number) => {
      const state = getFullStateAtTime(t);
      return Math.max(1, Math.ceil(state.maxDeficit / 4));
    },
    [getFullStateAtTime]
  );

  // 3. Precompute Story Beats (First Blood, Lead Changes, Spree x4+, Final Minute)
  const storyBeats: StoryBeat[] = useMemo(() => {
    if (!normalizedEvents.length) return [];

    const beats: StoryBeat[] = [];

    // First Blood
    const fb = normalizedEvents.find(e => e.isFirstBlood);
    if (fb) {
      beats.push({
        id: 'beat-fb',
        t: fb.t,
        type: 'first-blood',
        label: 'First Blood',
        description: `First Blood — ${fb.killer} kills ${fb.victim}`
      });
    }

    // Lead Changes
    leadChanges(game).forEach((change, i) => {
      beats.push({
        id: `beat-lead-${i}`,
        t: change.t,
        type: 'lead-change',
        label: 'Lead Change',
        description: isTeamMode
          ? `Lead change — ${change.to} takes the lead`
          : `Lead change — ${change.to} takes the lead (${change.score} kills)`
      });
    });

    normalizedEvents.forEach(ev => {
      // Spree x4+
      const spreeCallout = ev.callouts.find(c => c.startsWith('SPREE x'));
      if (spreeCallout) {
        const count = parseInt(spreeCallout.replace('SPREE x', ''), 10);
        if (count >= 4) {
          beats.push({
            id: `beat-spree-${ev.id}`,
            t: ev.t,
            type: 'spree',
            label: `Spree x${count}`,
            description: `${ev.killer} Spree (${count} kills in 20s)`
          });
        }
      }
    });

    // Final Minute Start
    if (matchDuration > 90) {
      const finalMinuteT = Math.max(0, matchDuration - 60);
      beats.push({
        id: 'beat-final-minute',
        t: finalMinuteT,
        type: 'final-minute',
        label: 'Final Minute',
        description: 'Final minute — closing battle'
      });
    }

    // Sort ascending by timestamp
    return beats.sort((a, b) => a.t - b.t);
  }, [game, normalizedEvents, isTeamMode, matchDuration]);

  // Exit story mode helper
  const exitStoryMode = useCallback(() => {
    setIsStoryMode(false);
    isStoryModeRef.current = false;
  }, []);

  // Instant Seek logic
  const seekTo = useCallback(
    (targetTime: number, fromStoryModeJump = false) => {
      // Any manual seek exits story mode
      if (!fromStoryModeJump && isStoryModeRef.current) {
        exitStoryMode();
      }

      const clamped = Math.max(0, Math.min(matchDuration, targetTime));
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);

      // Clear transient particle & trail effects
      particlesRef.current = [];
      trailsRef.current = {};
      lastRenderedKillsRef.current = new Set(
        normalizedEvents.filter(e => e.t <= clamped).map(e => e.id)
      );

      // Instantly recompute 30s breakpoint and ringStep
      const bp = Math.floor(clamped / 30);
      lastBreakpointRef.current = bp;
      pointsPerRingRef.current = computeRingStepAtTime(bp * 30);

      // Instantly snap orbit radii to target deficit rings (no lag on seek)
      const state = getFullStateAtTime(clamped);
      const step = pointsPerRingRef.current;
      allPilotNames.forEach(name => {
        const def = state.deficits[name] || 0;
        const ringFraction = Math.min(1.0, def / Math.max(1, 4 * step));
        orbitRadiiRef.current[name] = ringFraction;
      });

      if (onTimeUpdate) {
        onTimeUpdate(clamped);
      }
    },
    [matchDuration, normalizedEvents, computeRingStepAtTime, getFullStateAtTime, allPilotNames, exitStoryMode, onTimeUpdate]
  );

  // Jump Next / Prev Kill
  const jumpNextKill = useCallback(() => {
    const cur = currentTimeRef.current;
    const next = normalizedEvents.find(e => e.t > cur + 0.1);
    if (next) {
      seekTo(Math.max(0, next.t - 0.5));
    } else {
      seekTo(matchDuration);
    }
  }, [normalizedEvents, matchDuration, seekTo]);

  const jumpPrevKill = useCallback(() => {
    const cur = currentTimeRef.current;
    const prevs = normalizedEvents.filter(e => e.t < cur - 0.6);
    if (prevs.length > 0) {
      const target = prevs[prevs.length - 1];
      seekTo(Math.max(0, target.t - 0.5));
    } else {
      seekTo(0);
    }
  }, [normalizedEvents, seekTo]);

  const togglePlay = useCallback(() => {
    if (currentTimeRef.current >= matchDuration) {
      seekTo(0);
    }
    setIsPlaying(prev => !prev);
  }, [matchDuration, seekTo]);

  // Story Mode Trigger
  const toggleStoryMode = useCallback(() => {
    if (isStoryMode) {
      exitStoryMode();
      return;
    }

    if (!storyBeats.length) {
      // Fallback: play at 2x from 0
      setPlaybackSpeed(2);
      speedRef.current = 2;
      seekTo(0);
      setIsPlaying(true);
      return;
    }

    // Start Story Mode
    setIsStoryMode(true);
    isStoryModeRef.current = true;
    setPlaybackSpeed(2);
    speedRef.current = 2;
    storyBeatIndexRef.current = 0;

    // Start at beat 0 - 10s
    const firstBeat = storyBeats[0];
    const startTime = Math.max(0, firstBeat.t - 10);
    seekTo(startTime, true);
    setIsPlaying(true);
  }, [isStoryMode, storyBeats, exitStoryMode, seekTo]);

  // Theater Mode Toggle
  const toggleTheaterMode = useCallback(() => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Keyboard shortcuts (Space = play/pause, Left/Right = +-5s, Esc = fullscreen / story / collapse)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(currentTimeRef.current - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(currentTimeRef.current + 5);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        // Esc exits fullscreen first
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          return;
        }
        // Then exits story mode if active
        if (isStoryModeRef.current) {
          exitStoryMode();
          return;
        }
        // Then collapses the panel
        setIsOpen(false);
        setIsPlaying(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, togglePlay, seekTo, exitStoryMode]);

  // Document visibility change listener
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isPlayingRef.current) {
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localLastTime: number | null = null;

    if (lastBreakpointRef.current === -1) {
      const bp = Math.floor(currentTimeRef.current / 30);
      lastBreakpointRef.current = bp;
      pointsPerRingRef.current = computeRingStepAtTime(bp * 30);
    }

    const renderFrame = (timestamp: number) => {
      animFrameRef.current = requestAnimationFrame(renderFrame);
      if (!localLastTime) localLastTime = timestamp;
      const deltaSeconds = Math.min(0.1, (timestamp - localLastTime) / 1000);
      localLastTime = timestamp;

      // Advance replay clock if playing
      if (isPlayingRef.current) {
        const nextTime = currentTimeRef.current + deltaSeconds * speedRef.current;

        // Story Mode automated progression
        if (isStoryModeRef.current && storyBeats.length > 0) {
          const currentBeatIdx = storyBeatIndexRef.current;
          const currentBeat = storyBeats[currentBeatIdx];

          if (currentBeat) {
            const beatWindowEnd = Math.min(matchDuration, currentBeat.t + 10);
            if (nextTime >= beatWindowEnd) {
              if (currentBeatIdx < storyBeats.length - 1) {
                // Auto-jump to next story beat
                const nextBeatIdx = currentBeatIdx + 1;
                storyBeatIndexRef.current = nextBeatIdx;
                const nextStartTime = Math.max(0, storyBeats[nextBeatIdx].t - 10);
                seekTo(nextStartTime, true);
                return;
              } else {
                // Final beat reached: pause at final beat
                currentTimeRef.current = Math.min(matchDuration, currentBeat.t + 5);
                setCurrentTime(currentTimeRef.current);
                setIsPlaying(false);
                exitStoryMode();
                return;
              }
            }
          }
        }

        if (nextTime >= matchDuration) {
          currentTimeRef.current = matchDuration;
          setCurrentTime(matchDuration);
          setIsPlaying(false);
          if (isStoryModeRef.current) exitStoryMode();
        } else {
          currentTimeRef.current = nextTime;

          // Throttling: at >= 8x speed, throttle React state / ticker updates to ~5/sec
          const isHighSpeed = speedRef.current >= 8;
          if (isHighSpeed) {
            if (timestamp - lastTickerTimeUpdateRef.current >= 200) {
              lastTickerTimeUpdateRef.current = timestamp;
              setCurrentTime(nextTime);
            }
          } else {
            setCurrentTime(nextTime);
          }
        }

        // 30s breakpoint recomputation for ringStep
        const currentBp = Math.floor(currentTimeRef.current / 30);
        if (currentBp !== lastBreakpointRef.current) {
          lastBreakpointRef.current = currentBp;
          pointsPerRingRef.current = computeRingStepAtTime(currentBp * 30);
        }

        if (onTimeUpdate) {
          onTimeUpdate(currentTimeRef.current);
        }
      }

      const curT = currentTimeRef.current;
      const currentState = getFullStateAtTime(curT);

      // Handle Canvas Sizing with devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width;
      const cssHeight = rect.height;

      if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear Canvas Background
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      const cx = cssWidth / 2;
      const cy = cssHeight / 2;
      const R = Math.min(cssWidth, cssHeight) * 0.42;
      const innerR = R * 0.22;
      const maxOrbitR = R * 0.88;
      const orbitSpan = maxOrbitR - innerR;

      // Radar Dark Cosmic Gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      bgGrad.addColorStop(0, '#10141f');
      bgGrad.addColorStop(0.7, '#0b0e16');
      bgGrad.addColorStop(1, '#06070b');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // [NEW] Arena Backdrop Texture (desaturated, blurred, darkened, drawn at ~0.10 alpha)
      if (backdropCanvasRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.10;
        ctx.drawImage(backdropCanvasRef.current, cx - R, cy - R, 2 * R, 2 * R);
        ctx.restore();
      }

      // King-of-the-Hill Radar Concentric Rings
      const ringStep = pointsPerRingRef.current;
      const ringDeficits = [0, 1 * ringStep, 2 * ringStep, 3 * ringStep, 4 * ringStep];

      ringDeficits.forEach((def, rIdx) => {
        const ringFraction = rIdx / 4;
        const ringRadius = innerR + ringFraction * orbitSpan;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);

        if (rIdx === 0) {
          // Leader Ring (Inner Ring)
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.fillText('LEAD (0)', cx + ringRadius + 6, cy - 2);
        } else {
          // Deficit Rings
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = '9px monospace';
          ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
          ctx.fillText(`-${def}`, cx + ringRadius + 5, cy - 2);
        }
        ctx.restore();
      });

      // Crosshairs
      ctx.save();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
      ctx.restore();

      // Faint Arena Watermark
      const arenaName = (game.settings?.level || 'UNKNOWN MAP').toUpperCase();
      ctx.save();
      ctx.font = '900 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fillText(arenaName, cx, cy);
      ctx.restore();

      // Rim Kill Ticks (mirror linear scrubber around outer arena perimeter)
      ctx.save();
      normalizedEvents.forEach(ev => {
        const tickAngle = -Math.PI / 2 + (ev.t / matchDuration) * (Math.PI * 2);
        const tickColor = ev.suicide ? '#ef4444' : pilotColorMap[ev.killer] || '#ffffff';
        const innerPtX = cx + (R - (ev.isFirstBlood ? 7 : 4)) * Math.cos(tickAngle);
        const innerPtY = cy + (R - (ev.isFirstBlood ? 7 : 4)) * Math.sin(tickAngle);
        const outerPtX = cx + (R + (ev.isFirstBlood ? 4 : 2)) * Math.cos(tickAngle);
        const outerPtY = cy + (R + (ev.isFirstBlood ? 4 : 2)) * Math.sin(tickAngle);

        ctx.strokeStyle = tickColor;
        ctx.globalAlpha = ev.isFirstBlood ? 1.0 : 0.45;
        ctx.lineWidth = ev.isFirstBlood ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(innerPtX, innerPtY);
        ctx.lineTo(outerPtX, outerPtY);
        ctx.stroke();

        if (ev.isFirstBlood) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(outerPtX, outerPtY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();

      // Sweep Arm = Playhead (Angle = t/duration * 2pi, rotating clockwise from 12 o'clock)
      const sweepAngle = -Math.PI / 2 + (curT / matchDuration) * (Math.PI * 2);
      ctx.save();
      const armEndX = cx + Math.cos(sweepAngle) * R;
      const armEndY = cy + Math.sin(sweepAngle) * R;

      const sweepGrad = ctx.createLinearGradient(cx, cy, armEndX, armEndY);
      sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0.04)');
      sweepGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.25)');
      sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0.8)');

      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(armEndX, armEndY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(armEndX, armEndY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Compute Pilot Target Orbit Radii & Smooth Lerp
      allPilotNames.forEach(name => {
        const def = currentState.deficits[name] || 0;
        const targetFraction = Math.min(1.0, def / Math.max(1, 4 * ringStep));
        const currentFraction = orbitRadiiRef.current[name] ?? targetFraction;
        const lerpedFraction = currentFraction + (targetFraction - currentFraction) * (1 - Math.exp(-deltaSeconds * 2.8));
        orbitRadiiRef.current[name] = lerpedFraction;
      });

      // Calculate Preliminary Pilot Positions
      const pilotCount = Math.max(1, allPilotNames.length);
      const computedPilots: Array<{
        name: string;
        x: number;
        y: number;
        radius: number;
        color: string;
        isGhost: boolean;
        ghostAlpha: number;
        isFlashWhite: boolean;
        isKillerPulse: boolean;
        isLeader: boolean;
        score: number;
        survivalTau: number;
        timeSinceDeath: number;
      }> = [];

      allPilotNames.forEach((name, idx) => {
        const baseAngle = (idx / pilotCount) * (Math.PI * 2);
        const angularSpeed = 0.14 + (idx % 3) * 0.04;
        const wanderAngle = baseAngle + angularSpeed * curT + 0.18 * Math.sin(0.4 * curT + baseAngle);

        const assignedFraction = orbitRadiiRef.current[name] ?? 0;
        const assignedRadius = innerR + assignedFraction * orbitSpan;
        const wanderRadius = assignedRadius + 3.5 * Math.sin(0.7 * curT + idx);

        let px = cx + wanderRadius * Math.cos(wanderAngle);
        let py = cy + wanderRadius * Math.sin(wanderAngle);

        // Blip Radius ∝ score
        const score = isTeamMode
          ? currentState.teamScores[pilotTeamMap[name] || 'BLUE'] || 0
          : currentState.pilotScores[name] || 0;
        const baseRad = 11;
        const maxRad = 24.2;
        const blipRadius = Math.min(maxRad, Math.max(baseRad, baseRad + 2.6 * Math.sqrt(Math.max(0, score))));

        // Survival Aura calculation
        const lastDeath = currentState.lastDeathT[name] || 0;
        const timeSinceDeath = curT - lastDeath;
        const isGhost = lastDeath > 0 && timeSinceDeath >= 0 && timeSinceDeath < 3.0;
        const ghostAlpha = isGhost ? 0.25 + 0.15 * Math.sin(timeSinceDeath * 8) : 1.0;

        let survivalTau = 0;
        if (!isGhost) {
          const aliveTime = lastDeath === 0 ? curT : Math.max(0, timeSinceDeath - 3.0);
          survivalTau = Math.min(1.0, aliveTime / 60.0);
        }

        // Kill Pop check (victim blip flashes white for 150ms)
        const recentDeath = normalizedEvents.find(e => e.victim === name && curT >= e.t && curT - e.t <= 0.15);
        const isFlashWhite = Boolean(recentDeath);

        const recentKill = normalizedEvents.find(e => e.killer === name && !e.suicide && curT >= e.t && curT - e.t <= 0.35);
        const isKillerPulse = Boolean(recentKill);

        const isLeader = isTeamMode
          ? pilotTeamMap[name] === currentState.leadingTeam
          : name === currentState.leaderName;

        computedPilots.push({
          name,
          x: px,
          y: py,
          radius: blipRadius,
          color: pilotColorMap[name] || '#ffffff',
          isGhost,
          ghostAlpha,
          isFlashWhite,
          isKillerPulse,
          isLeader,
          score,
          survivalTau,
          timeSinceDeath
        });
      });

      // Declutter: Per-frame Separation / Repulsion Force between blips
      const repPasses = 2;
      for (let p = 0; p < repPasses; p++) {
        for (let i = 0; i < computedPilots.length; i++) {
          for (let j = i + 1; j < computedPilots.length; j++) {
            const pi = computedPilots[i];
            const pj = computedPilots[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.hypot(dx, dy);
            const minDist = pi.radius + pj.radius + 6;

            if (dist < minDist && dist > 0.001) {
              const overlap = (minDist - dist) * 0.5;
              const nx = dx / dist;
              const ny = dy / dist;
              pi.x += nx * overlap * 0.35;
              pi.y += ny * overlap * 0.35;
              pj.x -= nx * overlap * 0.35;
              pj.y -= ny * overlap * 0.35;
            }
          }
        }
      }

      // Clamp all pilots inside arena boundary
      computedPilots.forEach(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);
        const maxAllowed = R * 0.90;
        if (dist > maxAllowed && dist > 0) {
          p.x = cx + (dx / dist) * maxAllowed;
          p.y = cy + (dy / dist) * maxAllowed;
        }
      });

      const pilotPosLookup: Record<string, typeof computedPilots[0]> = {};
      computedPilots.forEach(p => {
        pilotPosLookup[p.name] = p;
      });

      // Check for New Events to trigger Aura Shatter
      normalizedEvents.forEach(ev => {
        if (curT >= ev.t && !lastRenderedKillsRef.current.has(ev.id)) {
          lastRenderedKillsRef.current.add(ev.id);

          const vic = pilotPosLookup[ev.victim];
          if (vic && isPlayingRef.current && speedRef.current < 8) {
            // At >= 8x speed: stop spawning new particles beyond pool cap
            if (vic.survivalTau > 0.1 && particlesRef.current.length < 100) {
              for (let s = 0; s < 12; s++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 70 + Math.random() * 110;
                particlesRef.current.push({
                  x: vic.x,
                  y: vic.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  color: vic.color,
                  size: 2.5 + Math.random() * 2,
                  alpha: 1.0,
                  life: 0,
                  maxLife: 0.5 + Math.random() * 0.2
                });
              }
            }
          }
        }
      });

      // Motion Trails (~20 positions)
      computedPilots.forEach(p => {
        if (!trailsRef.current[p.name]) trailsRef.current[p.name] = [];
        const trail = trailsRef.current[p.name];

        if (p.isGhost) {
          trail.length = 0;
        } else {
          trail.push({ x: p.x, y: p.y });
          if (trail.length > 20) trail.shift();

          if (trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            for (let i = 1; i < trail.length; i++) {
              const alpha = (i / trail.length) * 0.45;
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
              ctx.lineTo(trail[i].x, trail[i].y);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      });

      // Active Tracers & Kill Pop Effects
      const activeRecentEvents = normalizedEvents.filter(e => curT >= e.t && curT - e.t <= 0.35);

      activeRecentEvents.forEach(ev => {
        const killerP = pilotPosLookup[ev.killer];
        const victimP = pilotPosLookup[ev.victim];
        const eventAge = curT - ev.t;

        if (ev.suicide && victimP) {
          if (eventAge > 0.15) {
            const prog = (eventAge - 0.15) / 0.20;
            ctx.save();
            ctx.strokeStyle = `rgba(239, 68, 68, ${Math.max(0, 1 - prog)})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(victimP.x, victimP.y, victimP.radius + prog * 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        } else if (killerP && victimP) {
          // Tracers always draw (even at >= 8x speed)
          const prog = Math.min(1, Math.max(0, eventAge / 0.30));
          const wColor = getWeaponColor(ev.weapon);

          const midX = (killerP.x + victimP.x) / 2;
          const midY = (killerP.y + victimP.y) / 2;
          const perpX = -(victimP.y - killerP.y) * 0.18;
          const perpY = (victimP.x - killerP.x) * 0.18;
          const ctrlX = midX + perpX;
          const ctrlY = midY + perpY;

          ctx.save();
          ctx.strokeStyle = wColor;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = wColor;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = Math.max(0.2, 1 - prog * 0.8);

          ctx.beginPath();
          ctx.moveTo(killerP.x, killerP.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, victimP.x, victimP.y);
          ctx.stroke();

          const tHead = Math.min(1, prog * 1.5);
          const headX = (1 - tHead) * (1 - tHead) * killerP.x + 2 * (1 - tHead) * tHead * ctrlX + tHead * tHead * victimP.x;
          const headY = (1 - tHead) * (1 - tHead) * killerP.y + 2 * (1 - tHead) * tHead * ctrlY + tHead * tHead * victimP.y;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(headX, headY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (eventAge > 0.15) {
            const shockProg = (eventAge - 0.15) / 0.20;
            ctx.save();
            ctx.strokeStyle = `${wColor}${Math.round(Math.max(0, 1 - shockProg) * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(victimP.x, victimP.y, victimP.radius + shockProg * 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // At >= 8x speed: stop spawning new particles beyond pool cap
          if (isPlayingRef.current && speedRef.current < 8 && eventAge < 0.08 && particlesRef.current.length < 100) {
            for (let p = 0; p < 10; p++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 40 + Math.random() * 90;
              particlesRef.current.push({
                x: victimP.x,
                y: victimP.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: Math.random() > 0.4 ? wColor : '#ff4444',
                size: 2 + Math.random() * 2.5,
                alpha: 1,
                life: 0,
                maxLife: 0.45 + Math.random() * 0.25
              });
            }
          }
        }
      });

      // Update & Render Particles
      if (particlesRef.current.length > 0) {
        ctx.save();
        particlesRef.current = particlesRef.current.filter(p => {
          p.life += deltaSeconds * speedRef.current;
          if (p.life >= p.maxLife) return false;
          p.x += p.vx * deltaSeconds * speedRef.current;
          p.y += p.vy * deltaSeconds * speedRef.current;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          return true;
        });
        ctx.restore();
      }

      // Render Pilot Blips & Overlays
      computedPilots.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.isGhost ? p.ghostAlpha : 1.0;

        // Survival Aura Halo
        if (p.survivalTau > 0.04 && !p.isGhost) {
          ctx.save();
          const haloR = p.radius + 3 + p.survivalTau * 8;
          const haloAlpha = p.survivalTau * 0.75 * (0.85 + 0.15 * Math.sin(curT * 4));
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = haloAlpha;
          ctx.lineWidth = 1.8 + p.survivalTau * 1.5;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Killer Pulse Shockwave
        if (p.isKillerPulse) {
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Blip Body
        ctx.save();
        if (p.isFlashWhite) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 16;
        } else {
          ctx.fillStyle = '#111827';
          ctx.strokeStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.isGhost ? 0 : 8;
        }

        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Initials inside blip
        const initials = p.name.slice(0, 2).toUpperCase();
        ctx.fillStyle = p.isFlashWhite ? '#000000' : '#ffffff';
        const fontSize = Math.max(9, Math.round(p.radius * 0.75));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, p.x, p.y + 0.5);

        // Crown / Chevron for Leader
        if (p.isLeader) {
          ctx.save();
          const cyCrown = p.y - p.radius - 8;
          const w = 12;
          const h = 7;
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(p.x - w / 2, cyCrown + h / 2);
          ctx.lineTo(p.x - w / 2, cyCrown - h / 2);
          ctx.lineTo(p.x - w / 4, cyCrown);
          ctx.lineTo(p.x, cyCrown - h / 2 - 2);
          ctx.lineTo(p.x + w / 4, cyCrown);
          ctx.lineTo(p.x + w / 2, cyCrown - h / 2);
          ctx.lineTo(p.x + w / 2, cyCrown + h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Declutter Name Tags: Full name only for leader; everyone else initials, full name on hover
        const isHovered = hoveredPilotName === p.name;
        if (p.isLeader || isHovered) {
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = isHovered ? '#ffaa00' : p.isGhost ? '#64748b' : '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(p.name, p.x, p.y + p.radius + 12);

          if (isHovered) {
            ctx.save();
            ctx.font = '9px monospace';
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#475569';
            const streakSec = Math.round(p.survivalTau * 60);
            const tipText = `${p.score} pts · ${streakSec}s streak`;
            const tw = ctx.measureText(tipText).width + 10;
            ctx.fillRect(p.x - tw / 2, p.y + p.radius + 18, tw, 14);
            ctx.strokeRect(p.x - tw / 2, p.y + p.radius + 18, tw, 14);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(tipText, p.x, p.y + p.radius + 28);
            ctx.restore();
          }
        }

        ctx.restore();
      });

      // Final Minute Screen-Edge Vignette
      const isFinalMinute = curT > matchDuration - 60;
      if (isFinalMinute) {
        ctx.save();
        const vigGrad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.05);
        const pulseAlpha = 0.12 + 0.05 * Math.sin(curT * 4);
        vigGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        vigGrad.addColorStop(1, `rgba(239, 68, 68, ${pulseAlpha})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        ctx.restore();
      }

      // Scoreboard HUD (Top-Left)
      ctx.save();
      ctx.fillStyle = 'rgba(15, 17, 23, 0.88)';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      if (isTeamMode) {
        const hudW = 164;
        const hudH = isFinalMinute ? 76 : 58;
        ctx.fillRect(16, 16, hudW, hudH);
        ctx.strokeRect(16, 16, hudW, hudH);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('LIVE MATCH SCORE', 26, 32);

        // Blue team
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(`BLUE: ${currentState.teamScores.BLUE ?? 0}`, 26, 52);

        // Orange team
        ctx.fillStyle = '#fb923c';
        ctx.fillText(`ORANGE: ${currentState.teamScores.ORANGE ?? 0}`, 98, 52);

        if (isFinalMinute) {
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('⚡ FINAL MINUTE', 26, 68);
        }
      } else {
        const sortedFFA = Object.entries(currentState.pilotScores)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return (currentState.scoreReachedAt[a[0]] || 0) - (currentState.scoreReachedAt[b[0]] || 0);
          })
          .slice(0, 4);

        const hudW = 154;
        const hudH = (isFinalMinute ? 44 : 26) + sortedFFA.length * 18;
        ctx.fillRect(16, 16, hudW, hudH);
        ctx.strokeRect(16, 16, hudW, hudH);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('LEADERBOARD', 26, 32);

        sortedFFA.forEach(([pName, pScore], idx) => {
          ctx.font = '11px monospace';
          ctx.fillStyle = pilotColorMap[pName] || '#ffffff';
          const truncated = pName.length > 9 ? pName.slice(0, 8) + '…' : pName;
          ctx.fillText(`${truncated}:`, 26, 48 + idx * 18);

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(String(pScore), 158, 48 + idx * 18);
          ctx.textAlign = 'left';
        });

        if (isFinalMinute) {
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('⚡ FINAL MINUTE', 26, 38 + (sortedFFA.length + 1) * 18);
        }
      }
      ctx.restore();

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [
    isOpen,
    matchDuration,
    normalizedEvents,
    allPilotNames,
    pilotColorMap,
    pilotTeamMap,
    isTeamMode,
    game.settings?.level,
    getFullStateAtTime,
    computeRingStepAtTime,
    storyBeats,
    hoveredPilotName,
    exitStoryMode,
    seekTo,
    onTimeUpdate
  ]);

  if (!hasKills) {
    return null;
  }

  // Ticker items (last 6 events up to currentTime)
  const tickerEvents = normalizedEvents
    .filter(e => e.t <= currentTime)
    .slice(-6)
    .reverse();

  // Progress percentage for scrubber
  const progressPercent = matchDuration > 0 ? Math.min(100, (currentTime / matchDuration) * 100) : 0;

  // Reliable Scrubber Seek / Drag from Pointer Coordinates
  const seekFromPointerEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(ratio * matchDuration);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingScrubberRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    seekFromPointerEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverT = (hoverX / rect.width) * matchDuration;

    if (isDraggingScrubberRef.current && e.buttons > 0) {
      seekFromPointerEvent(e);
    }

    // Check closest story beat
    const closestBeat = storyBeats.find(b => Math.abs(b.t - hoverT) < 3.5);
    if (closestBeat) {
      setHoveredBeat({ beat: closestBeat, x: hoverX });
      setHoveredEvent(null);
      return;
    } else {
      setHoveredBeat(null);
    }

    // Check closest kill event
    const closestEvent = normalizedEvents.find(ev => Math.abs(ev.t - hoverT) < 3.5);
    if (closestEvent) {
      setHoveredEvent({ event: closestEvent, x: hoverX });
    } else {
      setHoveredEvent(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingScrubberRef.current) {
      isDraggingScrubberRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Canvas Mouse Move for Pilot Hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const R = Math.min(rect.width, rect.height) * 0.42;
    const innerR = R * 0.22;
    const maxOrbitR = R * 0.88;
    const orbitSpan = maxOrbitR - innerR;

    let closestPilot: string | null = null;
    let closestDist = 28;

    allPilotNames.forEach((name, idx) => {
      const assignedFraction = orbitRadiiRef.current[name] ?? 0;
      const assignedRadius = innerR + assignedFraction * orbitSpan;
      const baseAngle = (idx / Math.max(1, allPilotNames.length)) * (Math.PI * 2);
      const angularSpeed = 0.14 + (idx % 3) * 0.04;
      const wanderAngle = baseAngle + angularSpeed * currentTimeRef.current + 0.18 * Math.sin(0.4 * currentTimeRef.current + baseAngle);

      const px = cx + assignedRadius * Math.cos(wanderAngle);
      const py = cy + assignedRadius * Math.sin(wanderAngle);

      const d = Math.hypot(mx - px, my - py);
      if (d < closestDist) {
        closestDist = d;
        closestPilot = name;
      }
    });

    setHoveredPilotName(closestPilot);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-[#111] border border-gray-800 rounded font-mono overflow-hidden shadow-xl my-4 transition-all ${
        isTheaterMode ? 'fixed inset-0 z-50 w-screen h-screen m-0 rounded-none bg-[#0a0a0d] p-4 flex flex-col justify-between overflow-y-auto' : ''
      }`}
    >
      {/* Header Row: Always-Visible Caption + Watch Replay Toggle + Theater Mode */}
      <div className="px-5 py-3.5 bg-[#161618] border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#ff6600]/10 hover:bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/40 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{isOpen ? '▼ HIDE REPLAY' : '▶ WATCH REPLAY'}</span>
            <span className="text-[10px] text-gray-400 font-normal">({normalizedEvents.length} kills)</span>
          </button>

          {isOpen && (
            <button
              onClick={toggleTheaterMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                isTheaterMode
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500 shadow-md'
                  : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border-gray-700'
              }`}
              title="Toggle Fullscreen Theater Mode"
            >
              <span>{isTheaterMode ? '🗗 EXIT THEATER' : '⛶ THEATER'}</span>
            </button>
          )}
        </div>

        {/* ALWAYS-VISIBLE HONESTY CAPTION (protects trust) */}
        <div className="text-xs text-gray-400 italic tracking-wide flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Dramatized from the kill log — pilot positions are illustrative.</span>
        </div>
      </div>

      {/* Replay Panel Body (Expanded View) */}
      {isOpen && (
        <div className="p-4 space-y-4 animate-fade-in flex-1 flex flex-col justify-between">
          {/* Canvas & Live Kill Ticker Container */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
            {/* 2D Radar Canvas (responsive ~16:9) */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center">
              <div className="w-full bg-black rounded border border-gray-800 overflow-hidden relative aspect-video flex items-center justify-center shadow-2xl">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block cursor-crosshair"
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setHoveredPilotName(null)}
                />
              </div>

              {/* ALWAYS-VISIBLE RADAR LEGEND UNDER CANVAS */}
              <div className="mt-2 text-[11px] text-gray-400 font-mono tracking-wide text-center select-none">
                Ring = points off the lead · Blip size = score · Halo = survival streak
              </div>
            </div>

            {/* Live Combat Feed / Ticker */}
            <div className="lg:col-span-1 bg-[#141416] border border-gray-800 rounded p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">COMBAT FEED</span>
                  <span className="text-[10px] text-gray-500 font-bold">TICKER</span>
                </div>

                {tickerEvents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-600 italic">
                    Replay paused at start. Press play or scrub to begin combat feed.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] sm:max-h-none overflow-hidden">
                    {tickerEvents.map((evt, idx) => (
                      <div
                        key={evt.id}
                        className={`bg-[#1b1b1e] border border-gray-800/80 p-2 rounded text-xs transition-colors hover:border-gray-700 ${
                          idx > 0 ? 'hidden sm:block' : 'block'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                          <span className="font-bold text-gray-400">{formatTime(evt.t)}</span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold"
                            style={{
                              color: getWeaponColor(evt.weapon),
                              backgroundColor: `${getWeaponColor(evt.weapon)}15`,
                              border: `1px solid ${getWeaponColor(evt.weapon)}35`
                            }}
                          >
                            {evt.weapon}
                          </span>
                        </div>

                        {evt.suicide ? (
                          <div className="text-red-400 font-bold truncate">
                            <span style={{ color: pilotColorMap[evt.victim] }}>{evt.victim}</span> self-destructed
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold truncate" style={{ color: pilotColorMap[evt.killer] }}>
                              {evt.killer}
                            </span>
                            <span className="text-gray-500 text-[10px]">➔</span>
                            <span className="font-bold truncate" style={{ color: pilotColorMap[evt.victim] }}>
                              {evt.victim}
                            </span>
                          </div>
                        )}

                        {/* Callouts */}
                        {evt.callouts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {evt.callouts.map((c, i) => (
                              <span
                                key={i}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                  c === 'FIRST BLOOD'
                                    ? 'bg-red-950/60 text-red-300 border-red-700/80 shadow-xs'
                                    : c === 'REVENGE'
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-600/80'
                                    : 'bg-purple-950/60 text-purple-300 border-purple-600/80'
                                }`}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticker Bottom Quick Help */}
              <div className="mt-2 pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 hidden sm:block">
                <span>Hotkeys: Space (Play) • ←/→ (±5s) • Esc</span>
              </div>
            </div>
          </div>

          {/* Timeline Scrubber with Diamond Story Beat Markers */}
          <div className="relative">
            <div
              className="relative w-full h-10 bg-[#18181b] border border-gray-800 rounded cursor-pointer select-none px-1 flex items-center touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseLeave={() => {
                setHoveredEvent(null);
                setHoveredBeat(null);
              }}
            >
              {/* Background Track Bar */}
              <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden relative pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-[#ff6600]/80 to-[#ff6600] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Kill Marker Ticks */}
              {normalizedEvents.map(evt => {
                const tickLeft = (evt.t / matchDuration) * 100;
                const color = evt.suicide ? '#ef4444' : pilotColorMap[evt.killer] || '#ffffff';
                const hasCallout = evt.callouts.length > 0;

                return (
                  <div
                    key={evt.id}
                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ left: `${tickLeft}%` }}
                  >
                    <div
                      className={`rounded-full ${
                        evt.isFirstBlood
                          ? 'w-2 h-4 bg-red-500 shadow-md ring-1 ring-white'
                          : hasCallout
                          ? 'w-1.5 h-3.5 shadow-sm'
                          : 'w-1 h-2.5'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  </div>
                );
              })}

              {/* [NEW] Story Beat Diamond Markers */}
              {storyBeats.map(beat => {
                const beatLeft = (beat.t / matchDuration) * 100;
                return (
                  <button
                    key={beat.id}
                    onClick={e => {
                      e.stopPropagation();
                      seekTo(Math.max(0, beat.t - 5));
                    }}
                    className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rotate-45 bg-amber-400 border border-white shadow-lg cursor-pointer hover:scale-150 transition-transform z-20 group"
                    style={{ left: `${beatLeft}%` }}
                    title={beat.description}
                  />
                );
              })}

              {/* Scrubber Playhead Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-7 bg-white border border-[#ff6600] rounded shadow-lg pointer-events-none -ml-1.5 z-30"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Hover Tooltip (Kill Event or Story Beat) */}
            {hoveredBeat && (
              <div
                className="absolute -top-11 bg-amber-950/95 text-amber-200 text-[11px] font-mono px-3 py-1.5 rounded border border-amber-500 shadow-2xl pointer-events-none -translate-x-1/2 z-40 whitespace-nowrap"
                style={{ left: `${hoveredBeat.x}px` }}
              >
                <span className="text-white font-bold mr-1.5">♦ {formatTime(hoveredBeat.beat.t)}</span>
                <span>{hoveredBeat.beat.description}</span>
                <span className="text-[10px] text-amber-300/80 ml-2">(Click: -5s)</span>
              </div>
            )}

            {!hoveredBeat && hoveredEvent && (
              <div
                className="absolute -top-10 bg-black/90 text-white text-[11px] font-mono px-2.5 py-1 rounded border border-gray-700 shadow-xl pointer-events-none -translate-x-1/2 z-30 whitespace-nowrap"
                style={{ left: `${hoveredEvent.x}px` }}
              >
                <span className="text-gray-400 font-bold mr-1.5">{formatTime(hoveredEvent.event.t)}</span>
                {hoveredEvent.event.suicide ? (
                  <span className="text-red-400">{hoveredEvent.event.victim} self-destructed</span>
                ) : (
                  <span>
                    <span style={{ color: pilotColorMap[hoveredEvent.event.killer] }}>{hoveredEvent.event.killer}</span>
                    <span className="text-gray-400"> fragged </span>
                    <span style={{ color: pilotColorMap[hoveredEvent.event.victim] }}>{hoveredEvent.event.victim}</span>
                    <span className="text-gray-400"> ({hoveredEvent.event.weapon})</span>
                  </span>
                )}
                {hoveredEvent.event.callouts.length > 0 && (
                  <span className="ml-1.5 text-[9px] text-[#ff6600] font-bold">
                    [{hoveredEvent.event.callouts.join(', ')}]
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Playback Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => seekTo(0)}
                className="min-h-[36px] px-3 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-200 rounded text-xs font-bold transition-colors cursor-pointer select-none"
                title="Restart replay from beginning"
              >
                ⏮ RESTART
              </button>

              <button
                onClick={jumpPrevKill}
                className="min-h-[36px] px-2.5 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-200 rounded text-xs font-bold transition-colors cursor-pointer select-none"
                title="Jump to previous kill"
              >
                ⏮ PREV
              </button>

              <button
                onClick={togglePlay}
                className={`min-h-[36px] px-5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 select-none active:scale-95 ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-[#ff6600] hover:bg-[#ff8533] text-black shadow-md'
                }`}
              >
                <span>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</span>
              </button>

              <button
                onClick={jumpNextKill}
                className="min-h-[36px] px-3 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-gray-200 rounded text-xs font-bold transition-colors cursor-pointer select-none"
                title="Jump to next kill"
              >
                NEXT ⏭
              </button>
            </div>

            {/* Time Counter Display */}
            <div className="min-h-[36px] flex items-center text-sm font-bold text-gray-200 bg-[#161618] px-3.5 py-1.5 rounded border border-gray-800">
              <span className="text-[#ff6600]">{formatTime(currentTime)}</span>
              <span className="text-gray-600 mx-1.5">/</span>
              <span className="text-gray-400">{formatTime(matchDuration)}</span>
            </div>

            {/* Speeds & Story Mode Button */}
            <div className="flex items-center gap-2">
              {/* [NEW] STORY MODE BUTTON */}
              <button
                onClick={toggleStoryMode}
                className={`min-h-[34px] px-3.5 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer select-none flex items-center gap-1.5 border shadow-sm ${
                  isStoryMode
                    ? 'bg-amber-500 text-black border-amber-300 font-extrabold animate-pulse'
                    : 'bg-gradient-to-r from-amber-950/60 to-orange-950/60 hover:from-amber-900/80 hover:to-orange-900/80 text-amber-300 border-amber-600/60'
                }`}
                title="Story Mode: Compresses match into key highlight beats (lead changes, sprees, first blood)"
              >
                <span>{isStoryMode ? '■ EXIT STORY' : '▶ STORY'}</span>
                <span className="text-[10px] font-normal opacity-75">({storyBeats.length} beats)</span>
              </button>

              {/* [MODIFY] Speed Selector Extended to 0.5x, 1x, 2x, 4x, 8x, 16x */}
              <div className="flex items-center gap-0.5 bg-[#161618] p-1 rounded border border-gray-800">
                {[0.5, 1, 2, 4, 8, 16].map(spd => (
                  <button
                    key={spd}
                    onClick={() => {
                      if (isStoryMode) exitStoryMode();
                      setPlaybackSpeed(spd);
                    }}
                    className={`min-h-[30px] px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer select-none ${
                      playbackSpeed === spd
                        ? 'bg-[#ff6600] text-black font-extrabold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchReplay;
