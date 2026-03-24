'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { Timer } from '../Timer';
import { FloatingParticles, CandleFlicker } from '../Particles';

export function RoundtablePhase({ 
  state, 
  onAccuse, 
  onStartVoting 
}: { 
  state: GameState; 
  onAccuse: (targetId: string) => void;
  onStartVoting: () => void;
}) {
  const isHost = state.myId === state.hostId;
  const isAlive = state.players.find(p => p.id === state.myId)?.alive;
  const alivePlayers = state.players.filter(p => p.alive && p.id !== state.myId);
  const myAccusation = state.accusations?.find(a => a.accuserId === state.myId);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8 relative">
      <FloatingParticles count={15} color="gold" />
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <p className="text-amber-400/60 text-xs uppercase tracking-[0.3em]">Round {state.round}</p>
        <h2 className="text-2xl font-serif text-amber-300 mt-1">The Roundtable</h2>
        <p className="text-white/30 text-xs mt-1">Discuss who you think the traitor is</p>
      </motion.div>

      <Timer time={state.timer} maxTime={state.maxTimer} />

      <CandleFlicker />

      {state.accusations && state.accusations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm my-4 space-y-2"
        >
          <p className="text-red-400/60 text-xs uppercase tracking-wider text-center">Accusations</p>
          {state.accusations.map((acc) => {
            const accuser = state.players.find(p => p.id === acc.accuserId);
            const target = state.players.find(p => p.id === acc.targetId);
            return (
              <motion.div
                key={acc.accuserId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm bg-red-900/20 border border-red-900/30 rounded-lg p-2"
              >
                <span>{accuser?.emoji}</span>
                <span className="text-white/60">{accuser?.name}</span>
                <span className="text-red-400">→</span>
                <span>{target?.emoji}</span>
                <span className="text-white/60">{target?.name}</span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {isAlive && (
        <div className="w-full max-w-sm mt-4">
          <p className="text-white/30 text-xs mb-2 text-center">Tap to accuse someone</p>
          <div className="grid grid-cols-2 gap-2">
            {alivePlayers.map((player) => {
              const isAccused = myAccusation?.targetId === player.id;
              return (
                <motion.button
                  key={player.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAccuse(player.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                    isAccused
                      ? 'bg-red-900/40 border border-red-600/40'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{player.emoji}</span>
                  <span className="text-white/70 truncate">{player.name}</span>
                  {isAccused && <span className="text-red-400 ml-auto">⚠️</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {isHost && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartVoting}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black rounded-xl 
            font-semibold shadow-lg shadow-amber-900/30 hover:from-amber-500 hover:to-amber-400"
        >
          🗳️ Start the Vote
        </motion.button>
      )}

      {!isAlive && (
        <p className="text-white/20 text-sm mt-6">👻 You are spectating</p>
      )}
    </div>
  );
}
