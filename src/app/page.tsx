'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket';
import { initAudio } from '@/lib/sounds';
import { FloatingParticles, CandleFlicker } from '@/components/Particles';

const EMOJIS = ['🦊', '🐺', '🦉', '🐍', '🦅', '🐻', '🦌', '🐲', '🦁', '🐈', '🦇', '🐾'];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🦊');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = useCallback(() => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    setLoading(true);
    setError('');
    initAudio();
    
    const socket = getSocket();
    socket.emit('createRoom', { playerName: name.trim(), emoji }, (roomId) => {
      router.push(`/game/${roomId}`);
    });
  }, [name, emoji, router]);

  const handleJoin = useCallback(() => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Enter a room code');
      return;
    }
    setLoading(true);
    setError('');
    initAudio();

    const socket = getSocket();
    socket.emit('joinRoom', { roomId: roomCode.trim().toUpperCase(), playerName: name.trim(), emoji }, (success, errMsg) => {
      if (success) {
        router.push(`/game/${roomCode.trim().toUpperCase()}`);
      } else {
        setError(errMsg || 'Failed to join');
        setLoading(false);
      }
    });
  }, [name, emoji, roomCode, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <FloatingParticles count={20} color="gold" />

      <AnimatePresence mode="wait">
        {mode === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-sm"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <p className="text-6xl mb-4">🏰</p>
              <h1 className="text-5xl font-serif font-bold text-amber-300 text-glow-gold mb-2">
                The Traitors
              </h1>
              <p className="text-white/40 text-sm mb-2">A Game of Deception & Trust</p>
              <CandleFlicker />
            </motion.div>

            <div className="mt-8 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('create')}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black rounded-xl 
                  font-semibold text-lg shadow-lg shadow-amber-900/30 hover:from-amber-500 hover:to-amber-400"
              >
                ⚔️ Create Game
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('join')}
                className="w-full py-4 bg-white/5 border border-amber-900/30 text-amber-300 rounded-xl 
                  font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                🚪 Join Game
              </motion.button>
            </div>

            <p className="text-white/20 text-xs mt-8">4-12 players • Mobile browsers only • No install needed</p>
          </motion.div>
        )}

        {(mode === 'create' || mode === 'join') && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm"
          >
            <button
              onClick={() => { setMode('home'); setError(''); }}
              className="text-white/40 hover:text-white/60 text-sm mb-6 flex items-center gap-1"
            >
              ← Back
            </button>

            <h2 className="text-2xl font-serif text-amber-300 mb-6">
              {mode === 'create' ? '⚔️ Create Game' : '🚪 Join Game'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-white/40 text-sm block mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white 
                    placeholder:text-white/20 focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
                />
              </div>

              <div>
                <label className="text-white/40 text-sm block mb-2">Choose Your Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        emoji === e
                          ? 'bg-amber-600/30 border-2 border-amber-500/50 scale-110'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'join' && (
                <div>
                  <label className="text-white/40 text-sm block mb-1">Room Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="XXXXX"
                    maxLength={6}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-center 
                      font-mono text-2xl tracking-[0.3em] placeholder:text-white/20 placeholder:tracking-normal placeholder:text-base
                      focus:border-amber-600/50 focus:outline-none focus:ring-1 focus:ring-amber-600/30"
                  />
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={mode === 'create' ? handleCreate : handleJoin}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black rounded-xl 
                  font-semibold text-lg shadow-lg shadow-amber-900/30 hover:from-amber-500 hover:to-amber-400
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connecting...' : mode === 'create' ? 'Create Room' : 'Join Room'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
