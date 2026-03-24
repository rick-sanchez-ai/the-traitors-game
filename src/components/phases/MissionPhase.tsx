'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { Timer } from '../Timer';
import { FloatingParticles } from '../Particles';

export function MissionPhase({ state, onTap }: { state: GameState; onTap: () => void }) {
  const mission = state.mission;
  if (!mission) return null;

  const isAlive = state.players.find(p => p.id === state.myId)?.alive;
  const myScore = mission.scores[state.myId] || 0;
  const sortedScores = Object.entries(mission.scores)
    .map(([id, score]) => ({
      player: state.players.find(p => p.id === id),
      score,
    }))
    .sort((a, b) => b.score - a.score);

  if (mission.finished) {
    const winner = state.players.find(p => p.id === mission.winnerId);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <FloatingParticles count={20} color="gold" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="text-center"
        >
          <p className="text-5xl mb-4">🏆</p>
          <h2 className="text-2xl font-serif text-amber-300 mb-2">Mission Complete!</h2>
          {winner && (
            <p className="text-white/80 text-lg">
              {winner.emoji} {winner.name} wins!
            </p>
          )}
        </motion.div>
        <div className="mt-6 w-full max-w-sm space-y-2">
          {sortedScores.map(({ player, score }, i) => (
            <motion.div
              key={player?.id || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                player?.id === mission.winnerId ? 'bg-amber-900/30 border border-amber-700/30' : 'bg-white/5'
              }`}
            >
              <span className="text-white/50 text-sm w-6">#{i + 1}</span>
              <span className="text-xl">{player?.emoji}</span>
              <span className="text-white/80 flex-1">{player?.name}</span>
              <span className="text-amber-300 font-mono">{score}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!mission.started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <FloatingParticles count={15} color="purple" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-5xl mb-4">⚡</p>
          <h2 className="text-2xl font-serif text-purple-300 mb-2">Speed Tap Challenge</h2>
          <p className="text-white/40 text-sm mb-6">Tap as fast as you can!</p>
          <motion.p
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-4xl font-bold text-amber-300"
          >
            Get Ready...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <FloatingParticles count={10} color="purple" />
      
      <div className="mb-4">
        <Timer time={state.timer} maxTime={state.maxTimer} />
      </div>

      <h2 className="text-xl font-serif text-purple-300 mb-2">Speed Tap!</h2>

      {isAlive ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onTap}
          className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border-4 border-purple-400/30 
            flex items-center justify-center shadow-2xl shadow-purple-900/50 active:from-purple-500 active:to-purple-700 my-6"
        >
          <div className="text-center">
            <motion.p
              key={myScore}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-white"
            >
              {myScore}
            </motion.p>
            <p className="text-purple-300/60 text-xs uppercase">taps</p>
          </div>
        </motion.button>
      ) : (
        <p className="text-white/30 text-sm my-6">Spectating...</p>
      )}

      <div className="w-full max-w-sm space-y-1 mt-4">
        {sortedScores.slice(0, 3).map(({ player, score }, i) => (
          <div key={player?.id || i} className="flex items-center gap-2 text-sm">
            <span className="text-amber-300 w-5">#{i + 1}</span>
            <span>{player?.emoji}</span>
            <span className="text-white/60 flex-1">{player?.name}</span>
            <span className="text-amber-300 font-mono">{score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
