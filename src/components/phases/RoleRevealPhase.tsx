'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { FloatingParticles } from '../Particles';

export function RoleRevealPhase({ state }: { state: GameState }) {
  const [flipped, setFlipped] = useState(false);
  const isTraitor = state.myRole === 'traitor';
  const otherTraitors = state.players.filter(p => p.role === 'traitor' && p.id !== state.myId);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <FloatingParticles count={30} color={isTraitor && flipped ? 'red' : 'gold'} />
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-amber-400/60 text-sm uppercase tracking-[0.3em] mb-8"
      >
        Your fate awaits...
      </motion.p>

      <div className="w-72 h-96 cursor-pointer" style={{ perspective: '1000px' }} onClick={() => setFlipped(true)}>
        <motion.div
          className="relative w-full h-full"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-amber-700/50 flex flex-col items-center justify-center gap-4"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl"
            >
              🃏
            </motion.div>
            <p className="text-amber-300 font-serif text-xl">Tap to Reveal</p>
            <p className="text-white/30 text-sm">Your role in the game</p>
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-amber-400/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Card Back */}
          <div
            className={`absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 p-6 ${
              isTraitor 
                ? 'border-red-700/50 bg-gradient-to-b from-red-950 via-red-900/80 to-black' 
                : 'border-emerald-700/50 bg-gradient-to-b from-emerald-950 via-emerald-900/80 to-black'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <AnimatePresence>
              {flipped && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-7xl"
                  >
                    {isTraitor ? '🗡️' : '🛡️'}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-center"
                  >
                    <p className={`text-sm uppercase tracking-[0.3em] ${
                      isTraitor ? 'text-red-400/70' : 'text-emerald-400/70'
                    }`}>
                      You are a
                    </p>
                    <h2 className={`text-4xl font-serif font-bold mt-1 ${
                      isTraitor ? 'text-red-300' : 'text-emerald-300'
                    }`}>
                      {isTraitor ? 'TRAITOR' : 'FAITHFUL'}
                    </h2>
                  </motion.div>

                  {isTraitor && otherTraitors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-center mt-2"
                    >
                      <p className="text-red-400/50 text-xs uppercase tracking-wider">Your allies</p>
                      {otherTraitors.map(t => (
                        <p key={t.id} className="text-red-300 text-sm mt-1">
                          {t.emoji} {t.name}
                        </p>
                      ))}
                    </motion.div>
                  )}

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-white/40 text-xs text-center mt-2"
                  >
                    {isTraitor 
                      ? 'Eliminate the faithful. Trust no one.'
                      : 'Find the traitor(s) among you. Stay vigilant.'}
                  </motion.p>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {!flipped && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/40 text-sm mt-8"
        >
          Tap the card...
        </motion.p>
      )}
    </div>
  );
}
