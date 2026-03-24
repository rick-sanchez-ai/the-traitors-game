// Shared types for The Traitors game

export type Role = 'traitor' | 'faithful';
export type GamePhase = 'lobby' | 'roleReveal' | 'night' | 'murderReveal' | 'mission' | 'roundtable' | 'voting' | 'banishment' | 'gameOver';

export interface Player {
  id: string;
  name: string;
  emoji: string;
  alive: boolean;
  role?: Role;
  connected: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  emoji: string;
  alive: boolean;
  role?: Role; // Only included for the player themselves, or traitors seeing other traitors
  connected: boolean;
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface MissionState {
  type: 'speedTap';
  timeLeft: number;
  scores: Record<string, number>;
  started: boolean;
  finished: boolean;
  winnerId?: string;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: PlayerView[];
  hostId: string;
  round: number;
  timer: number;
  maxTimer: number;
  // Night phase
  nightVictimId?: string;
  nightVotes?: Record<string, string>; // traitorId -> victimId (only for traitors)
  // Murder reveal
  murderedPlayer?: PlayerView;
  // Mission
  mission?: MissionState;
  // Voting
  votes?: Vote[];
  votingResults?: { playerId: string; voteCount: number }[];
  banishedPlayer?: PlayerView;
  banishedRole?: Role;
  // Game over
  winners?: 'faithful' | 'traitors';
  // My info
  myId: string;
  myRole?: Role;
  // Accusations
  accusations?: { accuserId: string; targetId: string }[];
}

// Socket events from client to server
export interface ClientToServerEvents {
  createRoom: (data: { playerName: string; emoji: string }, callback: (roomId: string) => void) => void;
  joinRoom: (data: { roomId: string; playerName: string; emoji: string }, callback: (success: boolean, error?: string) => void) => void;
  startGame: () => void;
  nightVote: (targetId: string) => void;
  missionTap: () => void;
  accuse: (targetId: string) => void;
  castVote: (targetId: string) => void;
  skipMission: () => void;
  continueToNext: () => void;
  playAgain: () => void;
  requestState: (roomId: string) => void;
}

// Socket events from server to client
export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  error: (message: string) => void;
  soundEffect: (effect: 'night' | 'murder' | 'reveal' | 'vote' | 'traitorCaught' | 'faithfulBanished' | 'victory' | 'defeat' | 'tick' | 'mission' | 'missionWin') => void;
}
