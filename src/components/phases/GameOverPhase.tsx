'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { FloatingParticles, Confetti } from '@/components/Particles';

export function GameOverPhase({ state, onPlayAgain }: { state: GameState; onPlayAgain: () => void }) {
  const faithfulWin = state.winners === 'faithful';
  const isHost = state.myId === state.hostId;
  const myRole = state.myRole;
  const iWon = (faithfulWin && myRole === 'faithful') || (!faithfulWin && myRole === 'traitor');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles count={40} color={faithfulWin ? 'gold' : 'red'} />
      <Confetti active={iWon} />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-7xl mb-6 relative z-10"
      >
        {faithfulWin ? '🏰' : '🗡️'}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`text-4xl font-bold font-serif mb-2 relative z-10 ${
          faithfulWin ? 'text-amber-300 text-glow-gold' : 'text-red-400 text-glow-red'
        }`}
      >
        {faithfulWin ? 'The Faithful Prevail!' : 'The Traitors Win!'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-white/40 text-sm mb-2 relative z-10"
      >
        {faithfulWin ? 'All traitors have been unmasked!' : 'Deception triumphs over trust...'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className={`text-lg font-serif mb-8 relative z-10 ${iWon ? 'text-amber-300' : 'text-red-300'}`}
      >
        {iWon ? '🎉 You Won!' : '😈 Better luck next time...'}
      </motion.p>

      {/* All roles revealed */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="w-full max-w-sm relative z-10"
      >
        <p className="text-amber-400/60 text-xs uppercase tracking-wider text-center mb-3">All Roles Revealed</p>
        <div className="space-y-2">
          {state.players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.15 }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                p.role === 'traitor' ? 'bg-red-900/20' : 'bg-emerald-900/15'
              } border ${
                p.id === state.myId ? 'border-amber-600/30' : 'border-white/5'
              } ${!p.alive ? 'opacity-50' : ''}`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="flex-1 text-sm text-white/80">{p.name}{p.id === state.myId ? ' (you)' : ''}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                p.role === 'traitor'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {p.role === 'traitor' ? '🗡️ Traitor' : '🛡️ Faithful'}
              </span>
              {!p.alive && <span className="text-xs text-white/30">💀</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {isHost && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPlayAgain}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold text-lg rounded-xl
            shadow-lg shadow-amber-900/30 relative z-10"
        >
          🔄 Play Again
        </motion.button>
      )}
    </div>
  );
}
