'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { FloatingParticles, Confetti } from '@/components/Particles';

export function BanishmentPhase({ state }: { state: GameState }) {
  const isTraitor = state.banishedRole === 'traitor';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles count={25} color={isTraitor ? 'gold' : 'red'} />
      <Confetti active={isTraitor} />

      {/* Vote results */}
      {state.votingResults && (
        <div className="mb-8 w-full max-w-xs relative z-10">
          <p className="text-white/30 text-xs text-center mb-2">Votes</p>
          {state.votingResults.map((vr, i) => {
            const player = state.players.find(p => p.id === vr.playerId);
            return (
              <motion.div
                key={vr.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.3 }}
                className="flex justify-between py-1 text-sm"
              >
                <span className="text-white/60">{player?.emoji} {player?.name}</span>
                <span className="text-amber-300">{vr.voteCount} votes</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {state.banishedPlayer && (
        <div className="relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-white/40 tracking-widest uppercase mb-2"
          >
            Banished
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: 'spring' }}
            className="text-3xl font-bold font-serif mb-4"
          >
            {state.banishedPlayer.emoji} {state.banishedPlayer.name}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className={`inline-block text-2xl font-bold font-serif px-6 py-3 rounded-xl border-2 ${
              isTraitor
                ? 'text-red-400 border-red-500/40 bg-red-950/30 text-glow-red'
                : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
            }`}
          >
            {isTraitor ? '🗡️ TRAITOR' : '🛡️ FAITHFUL'}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
            className="text-white/30 text-sm mt-4"
          >
            {isTraitor ? '🎉 Justice has been served!' : '😔 An innocent has fallen...'}
          </motion.p>
        </div>
      )}
    </div>
  );
}
