
// Based on node/types/node/gameTypes.d.ts and node/types/node/completedTypes.d.ts

export interface PlayerData {
  name: string;
  team?: string;
  kills: number;
  assists: number;
  deaths: number;
  damage?: number;
  goals?: number; // Monsterball
  goalAssists?: number;
  blunders?: number;
  returns?: number; // CTF
  pickups?: number;
  captures?: number;
  carrierKills?: number;
  connected?: boolean;
  disconnected?: boolean;
  timeInGame?: number;
}

export interface KillEvent {
  time: number;
  attacker: string;
  attackerTeam?: string;
  defender: string;
  defenderTeam?: string;
  assisted?: string;
  assistedTeam?: string;
  weapon: string;
}

export interface DamageEvent {
  attacker: string;
  defender: string;
  damage: number;
  weapon: string;
}

export interface GameEvent {
  time: number;
  type: string;
  description: string;
  player?: string;
}

export interface ServerData {
  ip: string;
  keepListed?: boolean;
  name?: string;
  notes?: string;
  version?: string;
  numPlayers?: number;
  maxNumPlayers?: number;
  map?: string;
  mode?: string;
  lastSeen?: string; // Date string
  gameStarted?: string; // Date string
  old?: boolean;
}

export interface GameSettings {
  matchMode: string;
  level?: string;
  maxPlayers?: number;
  timeLimit?: number;
  scoreLimit?: number;
  creator?: string;
  friendlyFire?: boolean;
  joinInProgress?: boolean;
  teamCount?: number;
}

export interface GameData {
  id?: number;
  ip: string;
  date?: string; // Date added/completed
  start?: string;
  end?: string;
  settings?: GameSettings;
  server?: ServerData;
  players?: PlayerData[];
  kills?: KillEvent[];
  damage?: DamageEvent[];
  events?: GameEvent[];
  teamScore?: Record<string, number>;

  // Live/In-Progress specific
  inLobby?: boolean;
  countdown?: number;
  elapsed?: number;
  startTime?: string;
}

// API Responses based on node/web/api/
export interface BrowserApiResponse {
  server: {
    ip: string;
    name: string;
    serverNotes: string;
    lastSeen: string;
    online: boolean;
    version: string;
  };
  game?: {
    id?: number; // Game ID for fetching details
    gameStarted?: string;
    currentPlayers: number;
    maxPlayers: number;
    matchLength: number;
    mapName: string;
    mode: string;
    jip: boolean;
    hasPassword: boolean;
    matchNotes: string;
    inLobby: boolean;
    creator: string;
  };
}

export interface GameListApiResponse {
  games: GameData[];
  count?: number; // Total count of archived games
}

// WebSocket Message Types
export type WsMessage = {
  ip: string;
  data: {
    name: 'Stats';
    type: string;
    [key: string]: any;
  }
};

export interface LivePlayerState {
  name: string;
  team?: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  connected: boolean;
}

export interface MapData {
  id: number;
  name: string;
  image: string;
  size: string;
  maxPlayers: number;
  bestTeamSize: number;
  supportsCTF: boolean;
  author: string;
  date: string;
  downloadLink?: string | null;
  style: string; // tech, mixed, organic
  isCustom?: boolean;
  isStock?: boolean;
  downloads?: number;
  fileSize?: number;
  sorties?: number;
  totalKills?: number;
  totalDeaths?: number;
  totalDamage?: number;
  avgPlayers?: number;
  recent30d?: number;
  firstPlayed?: string | null;
  lastPlayed?: string | null;
  topPilot?: {
    name: string;
    sorties: number;
    kills: number;
    deaths: number;
    kd: number;
  } | null;
  recordMatch?: {
    id: number;
    kills: number;
    date: string;
    players: number;
  } | null;
}

export interface MapIntelData extends MapData {
  modes?: Record<string, number>;
  topPilots?: Array<{
    name: string;
    sorties: number;
    kills: number;
    deaths: number;
    kd: number;
  }>;
}

export interface AdminSettings {
  historyDepthPages: number; // 1 page = 25 games
}