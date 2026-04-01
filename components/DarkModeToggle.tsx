'use client';

import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(stored === 'dark' || (!stored && prefersDark));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="relative flex items-center rounded-full transition-all duration-300"
      style={{
        width: '42px', height: '24px',
        background: isDark ? 'var(--accent)' : 'var(--border)',
        padding: '3px',
      }}
    >
      <span
        className="flex items-center justify-center w-[18px] h-[18px] rounded-full transition-all duration-300 text-[11px]"
        style={{
          background: 'var(--bg-card)',
          transform: isDark ? 'translateX(18px)' : 'translateX(0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
