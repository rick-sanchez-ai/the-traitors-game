'use client';

import { motion } from 'framer-motion';

export function Timer({ time, maxTime }: { time: number; maxTime: number }) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const progress = maxTime > 0 ? time / maxTime : 0;
  const isLow = time <= 10;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={isLow ? { scale: [1, 1.05, 1] } : {}}
      transition={isLow ? { duration: 1, repeat: Infinity } : {}}
    >
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          <motion.path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={isLow ? '#ef4444' : '#d4af37'}
            strokeWidth="2"
            strokeDasharray={`${progress * 100}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-lg font-bold ${isLow ? 'text-red-400' : 'text-amber-300'}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
