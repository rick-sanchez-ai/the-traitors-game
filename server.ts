import { createServer } from 'http';
import { networkInterfaces } from 'os';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import type {
  GamePhase,
  Player,
  PlayerView,
  GameState,
  ClientToServerEvents,
  ServerToClientEvents,
} from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface ServerGame {
  roomId: string;
  phase: GamePhase;
  players: Map<string, Player>;
  hostId: string;
  round: number;
  nightVotes: Map<string, string>;
  murderedPlayerId?: string;
  accusations: { accuserId: string; targetId: string }[];
  votes: Map<string, string>;
  banishedPlayerId?: string;
  mission?: {
    type: 'speedTap';
    scores: Map<string, number>;
    started: boolean;
    finished: boolean;
    winnerId?: string;
    endTime: number;
  };
  shieldedPlayerId?: string;
  timerEnd: number;
  timerDuration: number;
  timerInterval?: ReturnType<typeof setInterval>;
  winners?: 'faithful' | 'traitors';
  roleRevealsReceived: Set<string>;
}

const games = new Map<string, ServerGame>();
const playerToRoom = new Map<string, string>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getTimeLeft(game: ServerGame): number {
  return Math.max(0, Math.ceil((game.timerEnd - Date.now()) / 1000));
}

function playerToView(player: Player, viewerId: string, game: ServerGame): PlayerView {
  const viewer = game.players.get(viewerId);
  const showRole =
    player.id === viewerId ||
    (viewer?.role === 'traitor' && player.role === 'traitor') ||
    game.phase === 'gameOver';

  return {
    id: player.id,
    name: player.name,
    emoji: player.emoji,
    alive: player.alive,
    role: showRole ? player.role : undefined,
    connected: player.connected,
  };
}

function buildGameState(game: ServerGame, playerId: string): GameState {
  const player = game.players.get(playerId);
  if (!player) throw new Error('Player not in game');

  const players = Array.from(game.players.values()).map(p =>
    playerToView(p, playerId, game)
  );

  const state: GameState = {
    roomId: game.roomId,
    phase: game.phase,
    players,
    hostId: game.hostId,
    round: game.round,
    timer: getTimeLeft(game),
    maxTimer: Math.ceil(game.timerDuration / 1000),
    myId: playerId,
    myRole: player.role,
  };

  if (game.phase === 'night' && player.role === 'traitor') {
    const nightVotes: Record<string, string> = {};
    for (const [tid, vid] of game.nightVotes) {
      nightVotes[tid] = vid;
    }
    state.nightVotes = nightVotes;
  }

  if (game.phase === 'murderReveal' && game.murderedPlayerId) {
    const murdered = game.players.get(game.murderedPlayerId);
    if (murdered) {
      state.murderedPlayer = playerToView(murdered, playerId, game);
    }
  }

  if (game.phase === 'mission' && game.mission) {
    const scores: Record<string, number> = {};
    for (const [pid, score] of game.mission.scores) {
      scores[pid] = score;
    }
    state.mission = {
      type: 'speedTap',
      timeLeft: Math.max(0, Math.ceil((game.mission.endTime - Date.now()) / 1000)),
      scores,
      started: game.mission.started,
      finished: game.mission.finished,
      winnerId: game.mission.winnerId,
    };
  }

  if (game.phase === 'roundtable') {
    state.accusations = [...game.accusations];
  }

  if (game.phase === 'voting') {
    state.votes = Array.from(game.votes.entries()).map(([voterId, targetId]) => ({
      voterId,
      targetId,
    }));
  }

  if (game.phase === 'banishment' && game.banishedPlayerId) {
    const banished = game.players.get(game.banishedPlayerId);
    if (banished) {
      state.banishedPlayer = {
        id: banished.id,
        name: banished.name,
        emoji: banished.emoji,
        alive: banished.alive,
        role: banished.role,
        connected: banished.connected,
      };
      state.banishedRole = banished.role;
    }

    const voteCounts = new Map<string, number>();
    for (const targetId of game.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    }
    state.votingResults = Array.from(voteCounts.entries())
      .map(([pid, voteCount]) => ({ playerId: pid, voteCount }))
      .sort((a, b) => b.voteCount - a.voteCount);
  }

  if (game.phase === 'gameOver') {
    state.winners = game.winners;
  }

  return state;
}

function broadcastState(game: ServerGame, io: SocketIOServer) {
  for (const [playerId] of game.players) {
    try {
      const state = buildGameState(game, playerId);
      io.to(playerId).emit('gameState', state);
    } catch {
      // disconnected
    }
  }
}

function emitSound(
  game: ServerGame,
  io: SocketIOServer,
  effect: Parameters<ServerToClientEvents['soundEffect']>[0]
) {
  for (const [playerId] of game.players) {
    io.to(playerId).emit('soundEffect', effect);
  }
}

function clearTimer(game: ServerGame) {
  if (game.timerInterval) {
    clearInterval(game.timerInterval);
    game.timerInterval = undefined;
  }
}

function startTimer(game: ServerGame, _io: SocketIOServer, durationMs: number, onComplete: () => void) {
  clearTimer(game);
  game.timerDuration = durationMs;
  game.timerEnd = Date.now() + durationMs;

  game.timerInterval = setInterval(() => {
    const timeLeft = getTimeLeft(game);
    if (timeLeft <= 0) {
      clearTimer(game);
      onComplete();
    }
  }, 1000);
}

function assignRoles(game: ServerGame) {
  const playerIds = Array.from(game.players.keys());
  const count = playerIds.length;
  const numTraitors = count >= 9 ? 2 : 1;

  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
  }

  for (let i = 0; i < playerIds.length; i++) {
    const player = game.players.get(playerIds[i])!;
    player.role = i < numTraitors ? 'traitor' : 'faithful';
  }
}

function checkWinCondition(game: ServerGame): 'faithful' | 'traitors' | null {
  const alive = Array.from(game.players.values()).filter(p => p.alive);
  const aliveTraitors = alive.filter(p => p.role === 'traitor');
  const aliveFaithful = alive.filter(p => p.role === 'faithful');

  if (aliveTraitors.length === 0) return 'faithful';
  if (aliveTraitors.length >= aliveFaithful.length) return 'traitors';
  return null;
}

function startNight(game: ServerGame, io: SocketIOServer) {
  game.phase = 'night';
  game.nightVotes.clear();
  game.accusations = [];
  emitSound(game, io, 'night');
  startTimer(game, io, 60_000, () => resolveNight(game, io));
  broadcastState(game, io);
}

function resolveNight(game: ServerGame, io: SocketIOServer) {
  if (game.phase !== 'night') return;
  clearTimer(game);

  const voteCounts = new Map<string, number>();
  for (const targetId of game.nightVotes.values()) {
    voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
  }

  let victimId: string | undefined;
  let maxVotes = 0;
  for (const [id, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      victimId = id;
    }
  }

  if (!victimId) {
    const faithfulAlive = Array.from(game.players.values())
      .filter(p => p.alive && p.role === 'faithful');
    if (faithfulAlive.length > 0) {
      victimId = faithfulAlive[Math.floor(Math.random() * faithfulAlive.length)].id;
    }
  }

  if (victimId === game.shieldedPlayerId) {
    game.shieldedPlayerId = undefined;
    game.murderedPlayerId = undefined;
    startRoundtable(game, io);
    return;
  }

  if (victimId) {
    const victim = game.players.get(victimId);
    if (victim) {
      victim.alive = false;
      game.murderedPlayerId = victimId;
    }
  }

  game.shieldedPlayerId = undefined;
  game.phase = 'murderReveal';
  game.timerDuration = 8000;
  game.timerEnd = Date.now() + 8000;
  emitSound(game, io, 'murder');
  broadcastState(game, io);

  setTimeout(() => {
    if (game.phase !== 'murderReveal') return;
    const win = checkWinCondition(game);
    if (win) {
      endGame(game, io, win);
    } else if (game.round % 2 === 0) {
      startMission(game, io);
    } else {
      startRoundtable(game, io);
    }
  }, 8000);
}

function startMission(game: ServerGame, io: SocketIOServer) {
  game.phase = 'mission';
  const scores = new Map<string, number>();
  for (const [id, p] of game.players) {
    if (p.alive) scores.set(id, 0);
  }
  game.mission = {
    type: 'speedTap',
    scores,
    started: true,
    finished: false,
    endTime: Date.now() + 10_000,
  };
  emitSound(game, io, 'mission');
  startTimer(game, io, 10_000, () => resolveMission(game, io));
  broadcastState(game, io);
}

function resolveMission(game: ServerGame, io: SocketIOServer) {
  if (!game.mission) return;
  clearTimer(game);
  game.mission.finished = true;

  let maxScore = 0;
  let winnerId: string | undefined;
  for (const [pid, score] of game.mission.scores) {
    if (score > maxScore) {
      maxScore = score;
      winnerId = pid;
    }
  }

  if (winnerId) {
    game.mission.winnerId = winnerId;
    game.shieldedPlayerId = winnerId;
  }

  emitSound(game, io, 'missionWin');
  broadcastState(game, io);

  setTimeout(() => {
    if (game.phase !== 'mission') return;
    startRoundtable(game, io);
  }, 5000);
}

function startRoundtable(game: ServerGame, io: SocketIOServer) {
  game.phase = 'roundtable';
  game.accusations = [];
  startTimer(game, io, 180_000, () => startVoting(game, io));
  broadcastState(game, io);
}

function startVoting(game: ServerGame, io: SocketIOServer) {
  game.phase = 'voting';
  game.votes.clear();
  emitSound(game, io, 'vote');
  startTimer(game, io, 60_000, () => resolveVoting(game, io));
  broadcastState(game, io);
}

function resolveVoting(game: ServerGame, io: SocketIOServer) {
  if (game.phase !== 'voting') return;
  clearTimer(game);

  const voteCounts = new Map<string, number>();
  for (const targetId of game.votes.values()) {
    voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
  }

  let maxVotes = 0;
  let banishedId: string | undefined;
  const tied: string[] = [];
  for (const [id, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      banishedId = id;
      tied.length = 0;
      tied.push(id);
    } else if (count === maxVotes) {
      tied.push(id);
    }
  }

  if (tied.length > 1) {
    banishedId = tied[Math.floor(Math.random() * tied.length)];
  }

  if (banishedId) {
    const banished = game.players.get(banishedId);
    if (banished) {
      banished.alive = false;
      game.banishedPlayerId = banishedId;
    }
  }

  game.phase = 'banishment';
  game.timerDuration = 10000;
  game.timerEnd = Date.now() + 10000;

  const banished = banishedId ? game.players.get(banishedId) : undefined;
  if (banished?.role === 'traitor') {
    emitSound(game, io, 'traitorCaught');
  } else {
    emitSound(game, io, 'faithfulBanished');
  }

  broadcastState(game, io);

  setTimeout(() => {
    if (game.phase !== 'banishment') return;
    const win = checkWinCondition(game);
    if (win) {
      endGame(game, io, win);
    } else {
      game.round++;
      startNight(game, io);
    }
  }, 10000);
}

function endGame(game: ServerGame, io: SocketIOServer, winner: 'faithful' | 'traitors') {
  clearTimer(game);
  game.phase = 'gameOver';
  game.winners = winner;
  emitSound(game, io, winner === 'faithful' ? 'victory' : 'defeat');
  broadcastState(game, io);
}

function resetGame(game: ServerGame) {
  game.phase = 'lobby';
  game.round = 1;
  game.nightVotes.clear();
  game.votes.clear();
  game.accusations = [];
  game.murderedPlayerId = undefined;
  game.banishedPlayerId = undefined;
  game.winners = undefined;
  game.mission = undefined;
  game.shieldedPlayerId = undefined;
  game.roleRevealsReceived.clear();
  clearTimer(game);

  for (const player of game.players.values()) {
    player.alive = true;
    player.role = undefined;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on('createRoom', ({ playerName, emoji }, callback) => {
      let roomId = generateRoomCode();
      while (games.has(roomId)) roomId = generateRoomCode();

      const player: Player = {
        id: socket.id,
        name: playerName,
        emoji: emoji || '🎭',
        alive: true,
        connected: true,
      };

      const game: ServerGame = {
        roomId,
        phase: 'lobby',
        players: new Map([[socket.id, player]]),
        hostId: socket.id,
        round: 1,
        nightVotes: new Map(),
        votes: new Map(),
        accusations: [],
        timerEnd: 0,
        timerDuration: 0,
        roleRevealsReceived: new Set(),
      };

      games.set(roomId, game);
      playerToRoom.set(socket.id, roomId);
      socket.join(roomId);
      callback(roomId);
      broadcastState(game, io);
    });

    socket.on('joinRoom', ({ roomId, playerName, emoji }, callback) => {
      const code = roomId.toUpperCase().trim();
      const game = games.get(code);

      if (!game) { callback(false, 'Room not found'); return; }
      if (game.phase !== 'lobby') { callback(false, 'Game already in progress'); return; }
      if (game.players.size >= 12) { callback(false, 'Room is full'); return; }

      const player: Player = {
        id: socket.id,
        name: playerName,
        emoji: emoji || '🎭',
        alive: true,
        connected: true,
      };

      game.players.set(socket.id, player);
      playerToRoom.set(socket.id, code);
      socket.join(code);
      callback(true);
      broadcastState(game, io);
    });

    socket.on('startGame', () => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.hostId !== socket.id) return;
      if (game.players.size < 3) { socket.emit('error', 'Need at least 3 players to start'); return; }

      assignRoles(game);
      game.phase = 'roleReveal';
      game.roleRevealsReceived.clear();
      game.timerDuration = 15000;
      game.timerEnd = Date.now() + 15000;
      emitSound(game, io, 'reveal');
      broadcastState(game, io);

      setTimeout(() => {
        if (game.phase === 'roleReveal') startNight(game, io);
      }, 15000);
    });

    socket.on('continueToNext', () => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game) return;

      if (game.phase === 'roleReveal') {
        game.roleRevealsReceived.add(socket.id);
        if (game.roleRevealsReceived.size >= game.players.size) startNight(game, io);
      } else if (game.phase === 'roundtable' && game.hostId === socket.id) {
        clearTimer(game);
        startVoting(game, io);
      }
    });

    socket.on('nightVote', (targetId) => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.phase !== 'night') return;
      const player = game.players.get(socket.id);
      if (!player || player.role !== 'traitor' || !player.alive) return;
      const target = game.players.get(targetId);
      if (!target || !target.alive || target.role === 'traitor') return;

      game.nightVotes.set(socket.id, targetId);

      for (const [pid, p] of game.players) {
        if (p.role === 'traitor') {
          io.to(pid).emit('gameState', buildGameState(game, pid));
        }
      }

      const aliveTraitors = Array.from(game.players.values()).filter(p => p.role === 'traitor' && p.alive);
      if (aliveTraitors.every(t => game.nightVotes.has(t.id))) resolveNight(game, io);
    });

    socket.on('missionTap', () => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.phase !== 'mission' || !game.mission || game.mission.finished) return;
      const player = game.players.get(socket.id);
      if (!player || !player.alive) return;

      const current = game.mission.scores.get(socket.id) || 0;
      game.mission.scores.set(socket.id, current + 1);
      broadcastState(game, io);
    });

    socket.on('accuse', (targetId) => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.phase !== 'roundtable') return;
      const player = game.players.get(socket.id);
      if (!player || !player.alive) return;

      game.accusations.push({ accuserId: socket.id, targetId });
      broadcastState(game, io);
    });

    socket.on('castVote', (targetId) => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.phase !== 'voting') return;
      const player = game.players.get(socket.id);
      if (!player || !player.alive) return;
      if (game.votes.has(socket.id)) return;

      game.votes.set(socket.id, targetId);
      broadcastState(game, io);

      const alive = Array.from(game.players.values()).filter(p => p.alive);
      if (alive.every(p => game.votes.has(p.id))) resolveVoting(game, io);
    });

    socket.on('skipMission', () => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.phase !== 'mission' || game.hostId !== socket.id) return;
      clearTimer(game);
      startRoundtable(game, io);
    });

    socket.on('requestState', (roomId: string) => {
      const game = games.get(roomId.toUpperCase().trim());
      if (!game) return;
      const existingRoom = playerToRoom.get(socket.id);
      if (existingRoom === roomId) {
        // Player is already in this room, just resend state
        try {
          const state = buildGameState(game, socket.id);
          socket.emit('gameState', state);
        } catch {
          // not in game
        }
      }
    });

    socket.on('playAgain', () => {
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game || game.hostId !== socket.id) return;
      resetGame(game);
      broadcastState(game, io);
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
      const roomId = playerToRoom.get(socket.id);
      if (!roomId) return;
      const game = games.get(roomId);
      if (!game) return;

      if (game.phase === 'lobby') {
        game.players.delete(socket.id);
        if (game.players.size === 0) {
          clearTimer(game);
          games.delete(roomId);
        } else {
          if (game.hostId === socket.id) {
            const first = game.players.values().next().value;
            if (first) game.hostId = first.id;
          }
          broadcastState(game, io);
        }
      } else {
        const player = game.players.get(socket.id);
        if (player) player.connected = false;
        broadcastState(game, io);
      }
      playerToRoom.delete(socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    const nets = networkInterfaces();
    let localIP = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]!) {
        if (net.family === 'IPv4' && !net.internal) {
          localIP = net.address;
          break;
        }
      }
      if (localIP !== 'localhost') break;
    }
    console.log(`
🏰 The Traitors Game Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Local:   http://localhost:${port}
📱 Network: http://${localIP}:${port}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Share the network URL with players!
    `);
  });
});
