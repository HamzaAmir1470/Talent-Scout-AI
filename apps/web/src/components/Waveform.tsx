'use client';
import { useEffect, useRef } from 'react';

export type OrbMode = 'idle' | 'listening' | 'speaking' | 'thinking';

// Theme tokens, so the waveform follows light and dark mode.
const TOKEN: Record<OrbMode, string> = { idle: '--faint', listening: '--brand', speaking: '--hi', thinking: '--muted' };

/** Animated bars. Real microphone levels while listening, a synthetic wave while the interviewer speaks. */
export default function Waveform({ analyser, mode, className = '' }: { analyser: AnalyserNode | null; mode: OrbMode; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const BARS = 48;
    const freq = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    let t = 0;
    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      t += 0.05;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const rgb = getComputedStyle(document.documentElement).getPropertyValue(TOKEN[mode]).trim();
      ctx.strokeStyle = `rgb(${rgb})`;
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(3, (w / BARS) * 0.5);
      if (mode === 'listening' && freq && analyser) analyser.getByteFrequencyData(freq);
      const step = w / BARS;
      for (let i = 0; i < BARS; i++) {
        const edge = Math.sin((i / (BARS - 1)) * Math.PI);
        let amp: number;
        if (mode === 'listening' && freq) amp = (freq[Math.floor((i / BARS) * freq.length * 0.55)] / 255) * (0.35 + edge * 0.65);
        else if (mode === 'speaking') amp = (0.22 + 0.6 * Math.abs(Math.sin(t * 1.7 + i * 0.35) * Math.sin(t * 0.8 + i * 0.12))) * (0.4 + edge * 0.6);
        else if (mode === 'thinking') amp = (0.1 + 0.12 * Math.sin(t * 2.2 - i * 0.45)) * (0.4 + edge * 0.6);
        else amp = 0.04 + 0.02 * Math.sin(t + i);
        const half = Math.max(2, amp * h * 0.46);
        const x = step * i + step / 2;
        ctx.beginPath(); ctx.moveTo(x, h / 2 - half); ctx.lineTo(x, h / 2 + half); ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [analyser, mode]);

  return <canvas ref={ref} className={`h-full w-full ${className}`} aria-hidden />;
}
