'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';

interface Props {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setDone(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center animate-fade-up">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--priority-low)', opacity: 0.9 }}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ color: 'var(--text-primary)' }} className="font-medium mb-1">Check your email</p>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm underline underline-offset-4"
          style={{ color: 'var(--accent)' }}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up afd-2">
      <div>
        <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="••••••••"
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#fee2e2', color: '#dc2626' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50"
        style={{ background: 'var(--text-primary)', color: 'var(--bg)' }}
      >
        {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {mode === 'login' ? (
          <>No account?{' '}
            <Link href="/signup" className="underline underline-offset-4"
              style={{ color: 'var(--accent)' }}>Sign up</Link>
          </>
        ) : (
          <>Already have one?{' '}
            <Link href="/login" className="underline underline-offset-4"
              style={{ color: 'var(--accent)' }}>Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
