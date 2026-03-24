'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { FloatingParticles, CandleFlicker } from '../Particles';

export function LobbyPhase({ state, onStart }: { state: GameState; onStart: () => void }) {
  const isHost = state.myId === state.hostId;
  const canStart = state.players.length >= 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <FloatingParticles count={15} color="gold" />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-serif font-bold text-amber-300 mb-2">The Traitors</h1>
        <CandleFlicker />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-sm border border-amber-900/30 rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="text-center mb-4">
          <p className="text-amber-400/70 text-sm uppercase tracking-wider">Room Code</p>
          <p className="text-4xl font-mono font-bold text-amber-300 tracking-[0.3em] mt-1">{state.roomId}</p>
          <p className="text-white/40 text-xs mt-1">Share this code with your friends</p>
        </div>

        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-white/50 text-sm mb-3 text-center">
            Players ({state.players.length}/12)
          </p>
          <div className="space-y-2">
            {state.players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  player.id === state.hostId 
                    ? 'bg-amber-900/30 border border-amber-700/30' 
                    : 'bg-white/5'
                } ${!player.connected ? 'opacity-50' : ''}`}
              >
                <span className="text-2xl">{player.emoji}</span>
                <span className="text-white/90 flex-1">{player.name}</span>
                {player.id === state.hostId && (
                  <span className="text-amber-400 text-xs bg-amber-400/10 px-2 py-0.5 rounded-full">HOST</span>
                )}
                {player.id === state.myId && (
                  <span className="text-emerald-400 text-xs">YOU</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {isHost && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            disabled={!canStart}
            className={`w-full mt-6 py-3 rounded-xl font-semibold text-lg transition-all ${
              canStart
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-900/30'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {canStart ? '⚔️ Begin the Game' : `Need ${3 - state.players.length} more players`}
          </motion.button>
        )}

        {!isHost && (
          <p className="text-center text-white/40 text-sm mt-6">
            Waiting for the host to start...
          </p>
        )}
      </motion.div>
    </div>
  );
}
