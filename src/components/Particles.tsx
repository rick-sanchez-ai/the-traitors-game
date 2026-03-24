'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateParticles(count: number): Particle[] {
  const p: Particle[] = [];
  for (let i = 0; i < count; i++) {
    p.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }
  return p;
}

export function FloatingParticles({ count = 20, color = 'gold' }: { count?: number; color?: string }) {
  const particles = useMemo(() => generateParticles(count), [count]);

  const colorMap: Record<string, string> = {
    gold: 'bg-amber-400',
    red: 'bg-red-500',
    purple: 'bg-purple-400',
    green: 'bg-emerald-400',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${colorMap[color] || 'bg-amber-400'}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function CandleFlicker() {
  return (
    <div className="flex justify-center gap-8 my-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="relative"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
        >
          <motion.div
            className="w-3 h-6 bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-200 rounded-full"
            animate={{
              scaleY: [1, 1.2, 0.9, 1.1, 1],
              scaleX: [1, 0.9, 1.1, 0.95, 1],
              opacity: [0.8, 1, 0.7, 0.9, 0.8],
            }}
            transition={{
              duration: 1.5 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-amber-400/30 rounded-full blur-sm" />
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-amber-400/20 rounded-full blur-md"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  size: number;
  duration: number;
  delay: number;
}

function generateConfetti(): ConfettiPiece[] {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9A826', '#E040FB', '#69F0AE'];
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < 50; i++) {
    pieces.push({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 2 + 2,
      delay: Math.random() * 1,
    });
  }
  return pieces;
}

export function Confetti({ active }: { active: boolean }) {
  const pieces = useMemo(() => (active ? generateConfetti() : []), [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: -20,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            borderRadius: 2,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: 900,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
