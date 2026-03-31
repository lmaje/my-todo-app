'use client';

import { useEffect, useState } from 'react';
import type { BadgeDefinition } from '@/lib/types';

interface Props {
  badges: BadgeDefinition[];
  xpGained: number;
  onDismiss: () => void;
}

export default function BadgeToast({ badges, xpGained, onDismiss }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }}
    >
      {/* XP gained toast */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium pointer-events-auto"
        style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
      >
        <span style={{ color: 'var(--accent)' }}>⚡</span>
        <span>+{xpGained} XP</span>
      </div>

      {/* Badge toasts */}
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg pointer-events-auto"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}
        >
          <span className="text-xl">{badge.icon}</span>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Badge Unlocked!</p>
            <p className="text-sm font-semibold">{badge.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{badge.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
