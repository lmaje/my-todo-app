'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Todo } from '@/lib/types';

const TOTAL = 25 * 60; // 25 minutes
const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

interface Props {
  todo: Todo;
  onClose: () => void;
  onComplete: (todoId: string) => void;
}

export default function PomodoroTimer({ todo, onClose, onComplete }: Props) {
  const [remaining, setRemaining] = useState(TOTAL);
  const [running,   setRunning]   = useState(false);
  const [finished,  setFinished]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => () => clear(), [clear]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear();
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return clear;
  }, [running, clear]);

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const progress = (TOTAL - remaining) / TOTAL;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  function handleReset() {
    clear();
    setRunning(false);
    setFinished(false);
    setRemaining(TOTAL);
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl overflow-hidden animate-slide-in"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border-focus)',
        boxShadow: 'var(--shadow-toast)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--accent-subtle)' }}
      >
        <div className="flex items-center gap-2">
          {running && (
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          )}
          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            {finished ? 'Session complete!' : running ? 'Focusing…' : 'Focus Timer'}
          </span>
        </div>
        <button onClick={onClose} className="opacity-40 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-primary)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M2 2l8 8M10 2L2 10" />
          </svg>
        </button>
      </div>

      {/* Task name */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{todo.text}</p>
      </div>

      {/* Ring + time */}
      <div className="flex flex-col items-center py-4 gap-3">
        <div className="relative w-28 h-28">
          <svg width="112" height="112" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl leading-none"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              {mins}:{secs}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
              remaining
            </span>
          </div>
        </div>

        {/* +10 XP bonus pill */}
        <div
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }}
        >
          ⚡ +10 bonus XP on completion
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 px-4 pb-4">
        {!finished ? (
          <>
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {running ? '⏸ Pause' : remaining === TOTAL ? '▶ Start' : '▶ Resume'}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              ↺
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { onComplete(todo.id); onClose(); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              ✓ Mark complete
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-70"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
