'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.3): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', gain: number = 0.15): void {
  for (const freq of frequencies) {
    playTone(freq, duration, type, gain);
  }
}

function playSequence(notes: { freq: number; dur: number; delay: number; type?: OscillatorType }[], gain: number = 0.2): void {
  const ctx = getAudioContext();
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = note.type || 'sine';
    osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.delay);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime + note.delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.delay + note.dur);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(ctx.currentTime + note.delay);
    osc.stop(ctx.currentTime + note.delay + note.dur);
  }
}

export function playSoundEffect(effect: string): void {
  try {
    switch (effect) {
      case 'night':
        // Eerie ambient — minor chord with tremolo
        playChord([220, 261, 329], 3, 'sine', 0.1);
        setTimeout(() => playChord([196, 233, 293], 3, 'sine', 0.08), 1500);
        break;
        
      case 'murder':
        // Sinister descending
        playSequence([
          { freq: 440, dur: 0.3, delay: 0, type: 'sawtooth' },
          { freq: 370, dur: 0.3, delay: 0.2, type: 'sawtooth' },
          { freq: 311, dur: 0.3, delay: 0.4, type: 'sawtooth' },
          { freq: 220, dur: 1.0, delay: 0.6, type: 'sawtooth' },
        ], 0.15);
        break;
        
      case 'reveal':
        // Dramatic reveal — building tension
        playSequence([
          { freq: 220, dur: 0.5, delay: 0 },
          { freq: 277, dur: 0.5, delay: 0.4 },
          { freq: 330, dur: 0.5, delay: 0.8 },
          { freq: 440, dur: 1.5, delay: 1.2 },
        ], 0.25);
        break;
        
      case 'vote':
        // Tension drums
        playSequence([
          { freq: 100, dur: 0.1, delay: 0, type: 'square' },
          { freq: 100, dur: 0.1, delay: 0.3, type: 'square' },
          { freq: 100, dur: 0.1, delay: 0.6, type: 'square' },
          { freq: 150, dur: 0.3, delay: 0.9, type: 'square' },
        ], 0.2);
        break;
        
      case 'traitorCaught':
        // Triumphant fanfare
        playSequence([
          { freq: 523, dur: 0.3, delay: 0 },
          { freq: 659, dur: 0.3, delay: 0.2 },
          { freq: 784, dur: 0.3, delay: 0.4 },
          { freq: 1047, dur: 1.0, delay: 0.6 },
        ], 0.25);
        playChord([523, 659, 784], 1.5, 'sine', 0.1);
        break;
        
      case 'faithfulBanished':
        // Sad descending
        playSequence([
          { freq: 440, dur: 0.5, delay: 0 },
          { freq: 392, dur: 0.5, delay: 0.4 },
          { freq: 349, dur: 0.5, delay: 0.8 },
          { freq: 293, dur: 1.0, delay: 1.2 },
        ], 0.2);
        break;
        
      case 'victory':
        // Major chord triumph
        playChord([523, 659, 784, 1047], 2, 'sine', 0.15);
        playSequence([
          { freq: 784, dur: 0.2, delay: 0.5 },
          { freq: 880, dur: 0.2, delay: 0.7 },
          { freq: 1047, dur: 0.2, delay: 0.9 },
          { freq: 1319, dur: 1.0, delay: 1.1 },
        ], 0.2);
        break;
        
      case 'defeat':
        // Minor defeat
        playChord([220, 261, 311], 2, 'sawtooth', 0.1);
        break;
        
      case 'tick':
        playTone(800, 0.05, 'square', 0.1);
        break;
        
      case 'mission':
        playChord([440, 554, 659], 1, 'triangle', 0.15);
        break;
        
      case 'missionWin':
        playSequence([
          { freq: 523, dur: 0.15, delay: 0, type: 'triangle' },
          { freq: 659, dur: 0.15, delay: 0.15, type: 'triangle' },
          { freq: 784, dur: 0.4, delay: 0.3, type: 'triangle' },
        ], 0.2);
        break;
    }
  } catch {
    // Audio not available
  }
}

// Must be called on user interaction to enable audio
export function initAudio(): void {
  try {
    getAudioContext();
  } catch {
    // ignore
  }
}
