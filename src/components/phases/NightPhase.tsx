'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { FloatingParticles, CandleFlicker } from '../Particles';
import { Timer } from '../Timer';

export function NightPhase({ state, onVote }: { state: GameState; onVote: (targetId: string) => void }) {
  const isTraitor = state.myRole === 'traitor';
  const isDead = !state.players.find(p => p.id === state.myId)?.alive;
  const aliveFaithful = state.players.filter(p => p.alive && p.id !== state.myId && p.role !== 'traitor');
  const myVote = state.nightVotes?.[state.myId];

  if (isDead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-black/50">
        <FloatingParticles count={10} color="purple" />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-center"
        >
          <p className="text-6xl mb-4">👻</p>
          <p className="text-white/40 font-serif text-xl">You watch from beyond...</p>
          <p className="text-white/20 text-sm mt-2">The night unfolds without you</p>
        </motion.div>
        <div className="mt-8">
          <Timer time={state.timer} maxTime={state.maxTimer} />
        </div>
      </div>
    );
  }

  if (!isTraitor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <FloatingParticles count={10} color="purple" />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <p className="text-5xl mb-4">🌙</p>
            <h2 className="text-2xl font-serif text-purple-300 mb-2">Night Falls...</h2>
            <p className="text-white/30 text-sm">Close your eyes and wait</p>
          </motion.div>
          
          <CandleFlicker />
          
          <div className="mt-8">
            <Timer time={state.timer} maxTime={state.maxTimer} />
          </div>

          <motion.div
            className="mt-8 text-white/10 text-xs"
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Something stirs in the darkness...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Traitor view
  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8 relative">
      <FloatingParticles count={20} color="red" />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mb-4"
      >
        <p className="text-red-400/60 text-xs uppercase tracking-[0.3em]">Night Phase</p>
        <h2 className="text-2xl font-serif text-red-300 mt-1">Choose Your Victim</h2>
      </motion.div>

      <Timer time={state.timer} maxTime={state.maxTimer} />

      <div className="w-full max-w-sm mt-6 space-y-2">
        {aliveFaithful.map((player, i) => {
          const isSelected = myVote === player.id;
          const otherTraitorsVoted = state.nightVotes 
            ? Object.entries(state.nightVotes).some(([tid, vid]) => tid !== state.myId && vid === player.id)
            : false;

          return (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onVote(player.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-red-900/50 border-2 border-red-500/50 shadow-lg shadow-red-900/30'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{player.emoji}</span>
              <span className="text-white/90 flex-1 text-left">{player.name}</span>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-red-400 text-xl"
                >
                  🗡️
                </motion.span>
              )}
              {otherTraitorsVoted && !isSelected && (
                <span className="text-red-400/50 text-xs">ally picked</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {state.nightVotes && Object.keys(state.nightVotes).length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400/50 text-xs mt-4"
        >
          Waiting for all traitors to agree...
        </motion.p>
      )}
    </div>
  );
}
