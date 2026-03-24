'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { FloatingParticles } from '../Particles';

export function MurderRevealPhase({ state }: { state: GameState }) {
  const isVictim = state.murderedPlayer?.id === state.myId;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <FloatingParticles count={25} color="red" />
      
      <motion.div
        className="fixed inset-0 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(127,0,0,0.3) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 80, delay: 0.5 }}
        className="text-center relative z-20"
      >
        {isVictim ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <p className="text-7xl mb-6">💀</p>
            <h2 className="text-3xl font-serif text-red-300 mb-2">You Have Been Murdered</h2>
            <p className="text-white/40 text-sm">The traitors chose you. You are now a spectator.</p>
          </motion.div>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-red-400/60 text-xs uppercase tracking-[0.3em] mb-4"
            >
              A body has been discovered
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <p className="text-5xl mb-4">{state.murderedPlayer?.emoji}</p>
              <h2 className="text-3xl font-serif text-red-300 mb-1">
                {state.murderedPlayer?.name}
              </h2>
              <p className="text-white/40 text-sm">has been murdered in the night</p>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="w-48 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent mx-auto mt-6"
            />
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.3] }}
              transition={{ delay: 2, duration: 2 }}
              className="text-white/30 text-xs mt-4"
            >
              The traitor walks among you still...
            </motion.p>
          </>
        )}
      </motion.div>
    </div>
  );
}
