'use client';

import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(dark);
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
      className="relative w-10 h-5.5 rounded-full transition-all duration-300 flex items-center px-0.5"
      style={{
        background: isDark ? 'var(--accent)' : 'var(--border)',
        width: '40px',
        height: '22px',
      }}
    >
      <span
        className="absolute w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-[9px]"
        style={{
          background: 'var(--bg-card)',
          left: isDark ? '20px' : '2px',
          top: '3px',
        }}
      >
        {isDark ? '🌙' : '☀'}
      </span>
    </button>
  );
}
