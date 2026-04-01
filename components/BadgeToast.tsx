'use client';

import { useEffect, useState } from 'react';
import type { BadgeDefinition } from '@/lib/types';

interface Props {
  badges: BadgeDefinition[];
  xpGained: number;
  onDismiss: () => void;
}

export default function BadgeToast({ badges, xpGained, onDismiss }: Props) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setHiding(true);
      setTimeout(onDismiss, 350);
    }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      style={{
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        opacity: hiding ? 0 : 1,
        transform: hiding ? 'translateY(8px)' : 'translateY(0)',
      }}
    >
      {/* XP pill */}
      <div
        className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold animate-toast-in"
        style={{
          background: 'var(--accent)',
          color: 'white',
          boxShadow: '0 4px 14px rgba(194,98,42,0.4)',
        }}
      >
        <span>⚡</span>
        <span>+{xpGained} XP</span>
      </div>

      {/* Badge cards */}
      {badges.map((badge, i) => (
        <div
          key={badge.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-toast-in"
          style={{
            animationDelay: `${i * 0.08}s`,
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-focus)',
            boxShadow: 'var(--shadow-toast)',
            minWidth: '220px',
          }}
        >
          <span className="text-2xl">{badge.icon}</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Badge Unlocked
            </p>
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
              {badge.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {badge.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
