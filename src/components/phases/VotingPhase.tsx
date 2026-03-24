'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { Timer } from '../Timer';
import { FloatingParticles } from '../Particles';

export function VotingPhase({ state, onVote }: { state: GameState; onVote: (targetId: string) => void }) {
  const isAlive = state.players.find(p => p.id === state.myId)?.alive;
  const alivePlayers = state.players.filter(p => p.alive && p.id !== state.myId);
  const hasVotingResults = state.votingResults && state.votingResults.length > 0;

  if (hasVotingResults) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <FloatingParticles count={15} color="gold" />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-6"
        >
          <h2 className="text-2xl font-serif text-amber-300">The Votes Are In</h2>
        </motion.div>

        <div className="w-full max-w-sm space-y-2">
          {state.votingResults!.map((result, i) => {
            const player = state.players.find(p => p.id === result.playerId);
            const isBanished = i === 0 && result.voteCount > 0;
            
            return (
              <motion.div
                key={result.playerId}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.5 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isBanished 
                    ? 'bg-red-900/30 border-2 border-red-500/40' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <span className="text-2xl">{player?.emoji}</span>
                <span className="text-white/90 flex-1">{player?.name}</span>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.5 + 0.3 }}
                  className="flex items-center gap-1"
                >
                  <span className="text-amber-300 font-bold text-lg">{result.voteCount}</span>
                  <span className="text-white/30 text-xs">votes</span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {state.banishedPlayer && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: state.votingResults!.length * 0.5 + 0.5 }}
            className="text-red-400/70 text-sm mt-6 text-center"
          >
            {state.banishedPlayer.emoji} {state.banishedPlayer.name} has been banished...
          </motion.p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8 relative">
      <FloatingParticles count={15} color="red" />
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <p className="text-red-400/60 text-xs uppercase tracking-[0.3em]">Banishment Vote</p>
        <h2 className="text-2xl font-serif text-amber-300 mt-1">Who Do You Banish?</h2>
        <p className="text-white/30 text-xs mt-1">Your vote is secret</p>
      </motion.div>

      <Timer time={state.timer} maxTime={state.maxTimer} />

      {isAlive ? (
        <div className="w-full max-w-sm mt-6 space-y-2">
          {alivePlayers.map((player, i) => (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onVote(player.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 
                hover:bg-red-900/20 hover:border-red-600/30 transition-all active:bg-red-900/40"
            >
              <span className="text-2xl">{player.emoji}</span>
              <span className="text-white/90 flex-1 text-left">{player.name}</span>
              <span className="text-white/20 text-sm">Banish →</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <p className="text-white/20 text-sm mt-8">👻 You are spectating the vote</p>
      )}
    </div>
  );
}
