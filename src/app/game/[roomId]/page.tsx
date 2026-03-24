'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import type { GameState } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import { playSoundEffect, initAudio } from '@/lib/sounds';
import { LobbyPhase } from '@/components/phases/LobbyPhase';
import { RoleRevealPhase } from '@/components/phases/RoleRevealPhase';
import { NightPhase } from '@/components/phases/NightPhase';
import { MurderRevealPhase } from '@/components/phases/MurderRevealPhase';
import { MissionPhase } from '@/components/phases/MissionPhase';
import { RoundtablePhase } from '@/components/phases/RoundtablePhase';
import { VotingPhase } from '@/components/phases/VotingPhase';
import { BanishmentPhase } from '@/components/phases/BanishmentPhase';
import { GameOverPhase } from '@/components/phases/GameOverPhase';

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    initAudio();
    const socket = getSocket();

    socket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    socket.on('soundEffect', (effect) => {
      playSoundEffect(effect);
    });

    socket.on('error', (msg: string) => {
      setError(msg);
      setTimeout(() => setError(''), 3000);
    });

    // Request current state in case we missed the initial broadcast
    socket.emit('requestState', roomId);

    return () => {
      socket.off('gameState');
      socket.off('soundEffect');
      socket.off('error');
    };
  }, [roomId]);

  const handleStartGame = useCallback(() => {
    initAudio();
    getSocket().emit('startGame');
  }, []);

  const handleNightVote = useCallback((targetId: string) => {
    getSocket().emit('nightVote', targetId);
  }, []);

  const handleMissionTap = useCallback(() => {
    getSocket().emit('missionTap');
  }, []);

  const handleAccuse = useCallback((targetId: string) => {
    getSocket().emit('accuse', targetId);
  }, []);

  const handleCastVote = useCallback((targetId: string) => {
    getSocket().emit('castVote', targetId);
  }, []);

  const handleStartVoting = useCallback(() => {
    getSocket().emit('continueToNext');
  }, []);

  const handlePlayAgain = useCallback(() => {
    getSocket().emit('playAgain');
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4 animate-pulse">🏰</p>
          <p className="text-amber-300/60 font-serif">Connecting to the castle...</p>
          <p className="text-white/20 text-sm mt-2">Room: {roomId}</p>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            onClick={() => router.push('/')}
            className="mt-6 text-amber-400/50 hover:text-amber-400 text-sm underline"
          >
            ← Back to lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-900/80 border border-red-600/50 text-red-200 text-sm p-3 rounded-xl text-center">
          {error}
        </div>
      )}
      
      {gameState.phase === 'lobby' && (
        <LobbyPhase state={gameState} onStart={handleStartGame} />
      )}
      {gameState.phase === 'roleReveal' && (
        <RoleRevealPhase state={gameState} />
      )}
      {gameState.phase === 'night' && (
        <NightPhase state={gameState} onVote={handleNightVote} />
      )}
      {gameState.phase === 'murderReveal' && (
        <MurderRevealPhase state={gameState} />
      )}
      {gameState.phase === 'mission' && (
        <MissionPhase state={gameState} onTap={handleMissionTap} />
      )}
      {gameState.phase === 'roundtable' && (
        <RoundtablePhase state={gameState} onAccuse={handleAccuse} onStartVoting={handleStartVoting} />
      )}
      {gameState.phase === 'voting' && (
        <VotingPhase state={gameState} onVote={handleCastVote} />
      )}
      {gameState.phase === 'banishment' && (
        <BanishmentPhase state={gameState} />
      )}
      {gameState.phase === 'gameOver' && (
        <GameOverPhase state={gameState} onPlayAgain={handlePlayAgain} />
      )}
    </>
  );
}
