import { io, Socket } from 'socket.io-client';

const URL = process.env.URL || 'https://game-production-bb41.up.railway.app';
const PLAYER_COUNT = 10;

interface PlayerClient {
  name: string;
  emoji: string;
  socket: Socket;
  role?: string;
  alive: boolean;
  id?: string;
  phase?: string;
}

const NAMES = ['Ashraf', 'Rick', 'Morty', 'Beth', 'Jerry', 'Summer', 'Birdperson', 'Squanchy', 'Evil Morty', 'Mr. Meeseeks'];
const EMOJIS = ['🦊', '🐺', '🦉', '🐍', '🦅', '🐻', '🦌', '🐲', '🦁', '🐈'];

const players: PlayerClient[] = [];
let roomId = '';
let gamePhase = '';
let round = 0;

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createPlayer(index: number): Promise<PlayerClient> {
  return new Promise((resolve) => {
    const socket = io(URL, { transports: ['websocket', 'polling'], autoConnect: true });
    const player: PlayerClient = {
      name: NAMES[index],
      emoji: EMOJIS[index],
      socket,
      alive: true,
    };

    socket.on('connect', () => {
      log(`✅ ${player.name} connected (${socket.id})`);
      resolve(player);
    });

    socket.on('gameState', (state: any) => {
      player.id = state.myId;
      player.role = state.myRole;
      player.alive = state.players.find((p: any) => p.id === state.myId)?.alive ?? true;
      
      if (state.phase !== gamePhase) {
        gamePhase = state.phase;
        round = state.round;
        log(`\n${'='.repeat(50)}`);
        log(`📍 PHASE: ${state.phase.toUpperCase()} (Round ${state.round})`);
        log(`${'='.repeat(50)}`);
        
        const alive = state.players.filter((p: any) => p.alive);
        log(`👥 Alive: ${alive.length}/${state.players.length}`);
        
        if (state.phase === 'roleReveal') {
          log(`🎭 ${player.name} is ${state.myRole?.toUpperCase() || 'unknown'}`);
        }
        if (state.phase === 'murderReveal' && state.murderedPlayer) {
          log(`⚰️ ${state.murderedPlayer.emoji} ${state.murderedPlayer.name} was MURDERED!`);
        }
        if (state.phase === 'banishment' && state.banishedPlayer) {
          log(`🗳️ ${state.banishedPlayer.emoji} ${state.banishedPlayer.name} was BANISHED — they were ${state.banishedRole?.toUpperCase()}`);
        }
        if (state.phase === 'gameOver') {
          log(`\n🏆🏆🏆 GAME OVER — ${state.winners?.toUpperCase()} WIN! 🏆🏆🏆`);
          log(`\nFinal roles:`);
          state.players.forEach((p: any) => {
            log(`  ${p.emoji} ${p.name}: ${p.role} ${p.alive ? '(alive)' : '(dead)'}`);
          });
        }
      }
    });

    socket.on('soundEffect', (effect: string) => {
      // log(`🔊 Sound: ${effect}`);
    });

    socket.on('error', (msg: string) => {
      log(`❌ ${player.name} error: ${msg}`);
    });

    socket.on('disconnect', () => {
      log(`🔌 ${player.name} disconnected`);
    });
  });
}

async function run() {
  log(`🏰 THE TRAITORS — Full Game Test (${PLAYER_COUNT} players)`);
  log(`🌐 Server: ${URL}\n`);

  // Create all players
  log('--- Creating players ---');
  for (let i = 0; i < PLAYER_COUNT; i++) {
    const player = await createPlayer(i);
    players.push(player);
    await sleep(200);
  }

  // Player 0 creates the room
  log('\n--- Creating room ---');
  await new Promise<void>((resolve) => {
    players[0].socket.emit('createRoom', { playerName: players[0].name, emoji: players[0].emoji }, (id: string) => {
      roomId = id;
      log(`🏰 Room created: ${roomId} by ${players[0].name}`);
      resolve();
    });
  });

  await sleep(500);

  // Other players join
  log('\n--- Players joining ---');
  for (let i = 1; i < PLAYER_COUNT; i++) {
    await new Promise<void>((resolve) => {
      players[i].socket.emit('joinRoom', { roomId, playerName: players[i].name, emoji: players[i].emoji }, (success: boolean, err?: string) => {
        if (success) {
          log(`🚪 ${players[i].name} joined room ${roomId}`);
        } else {
          log(`❌ ${players[i].name} failed to join: ${err}`);
        }
        resolve();
      });
    });
    await sleep(300);
  }

  await sleep(1000);
  log(`\n✅ All ${PLAYER_COUNT} players in the lobby!`);

  // Host starts the game
  log('\n--- Starting game ---');
  players[0].socket.emit('startGame');

  // Wait for role reveal
  await sleep(2000);
  
  // Log all roles
  log('\n🎭 Role Assignment:');
  const traitors: PlayerClient[] = [];
  const faithful: PlayerClient[] = [];
  for (const p of players) {
    log(`  ${p.emoji} ${p.name}: ${p.role?.toUpperCase() || 'unknown'}`);
    if (p.role === 'traitor') traitors.push(p);
    else faithful.push(p);
  }
  log(`\n  Traitors: ${traitors.map(t => t.name).join(', ')}`);
  log(`  Faithful: ${faithful.map(f => f.name).join(', ')}`);

  // All players acknowledge role reveal
  await sleep(1000);
  for (const p of players) {
    p.socket.emit('continueToNext');
  }

  // Now we play the game loop automatically
  // Listen for phase changes and respond appropriately
  let gameOver = false;
  
  const gameLoop = async () => {
    while (!gameOver) {
      await sleep(2000);
      
      if (gamePhase === 'night') {
        // Traitors vote to kill a random faithful
        log('\n🌙 Traitors choosing victim...');
        await sleep(1000);
        const aliveTraitors = traitors.filter(t => t.alive);
        const aliveFaithful = faithful.filter(f => f.alive);
        
        if (aliveFaithful.length > 0 && aliveTraitors.length > 0) {
          const victim = aliveFaithful[Math.floor(Math.random() * aliveFaithful.length)];
          log(`🗡️ Traitors target: ${victim.name}`);
          for (const t of aliveTraitors) {
            t.socket.emit('nightVote', victim.id);
            await sleep(200);
          }
        }
      }
      
      if (gamePhase === 'mission') {
        // Everyone taps like crazy
        log('\n🏆 Mission: Speed Tap!');
        const alivePlayers = players.filter(p => p.alive);
        for (let tap = 0; tap < 15; tap++) {
          for (const p of alivePlayers) {
            p.socket.emit('missionTap');
          }
          await sleep(300);
        }
        // Host can skip mission
        await sleep(3000);
        players[0].socket.emit('skipMission');
      }

      if (gamePhase === 'roundtable') {
        // Simulate discussion, then host starts voting
        log('\n💬 Roundtable discussion...');
        await sleep(2000);
        
        // Some accusations
        const alivePlayers = players.filter(p => p.alive);
        if (alivePlayers.length > 1) {
          const accuser = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          const target = alivePlayers.filter(p => p.id !== accuser.id)[Math.floor(Math.random() * (alivePlayers.length - 1))];
          if (target) {
            accuser.socket.emit('accuse', target.id);
            log(`☝️ ${accuser.name} accuses ${target.name}!`);
          }
        }
        
        await sleep(1000);
        // Host moves to voting
        const host = players.find(p => p.id && p.alive) || players[0];
        host.socket.emit('continueToNext');
      }

      if (gamePhase === 'voting') {
        // Everyone votes for a random person
        log('\n🗳️ Voting...');
        await sleep(1000);
        const alivePlayers = players.filter(p => p.alive);
        
        for (const voter of alivePlayers) {
          const candidates = alivePlayers.filter(p => p.id !== voter.id);
          if (candidates.length > 0) {
            // Faithful have a slight chance to detect traitors, traitors vote faithful
            let target: PlayerClient;
            if (voter.role === 'traitor') {
              // Traitors vote for a random faithful
              const faithfulCandidates = candidates.filter(c => c.role === 'faithful');
              target = faithfulCandidates.length > 0 
                ? faithfulCandidates[Math.floor(Math.random() * faithfulCandidates.length)]
                : candidates[Math.floor(Math.random() * candidates.length)];
            } else {
              // Faithful vote randomly (50% chance to vote for a traitor if one exists)
              const traitorCandidates = candidates.filter(c => c.role === 'traitor');
              if (traitorCandidates.length > 0 && Math.random() < 0.3) {
                target = traitorCandidates[Math.floor(Math.random() * traitorCandidates.length)];
              } else {
                target = candidates[Math.floor(Math.random() * candidates.length)];
              }
            }
            voter.socket.emit('castVote', target.id);
            log(`  ${voter.emoji} ${voter.name} votes to banish ${target.name}`);
            await sleep(200);
          }
        }
      }

      if (gamePhase === 'gameOver') {
        gameOver = true;
        log('\n✅ Game complete!');
        break;
      }

      // Wait between checks
      await sleep(1000);
    }
  };

  await gameLoop();

  // Cleanup
  await sleep(3000);
  log('\n--- Disconnecting all players ---');
  for (const p of players) {
    p.socket.disconnect();
  }
  
  log('\n🎮 TEST COMPLETE!\n');
  process.exit(0);
}

// Timeout safety
setTimeout(() => {
  log('\n⏰ Test timed out after 5 minutes');
  for (const p of players) p.socket.disconnect();
  process.exit(1);
}, 300000);

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
