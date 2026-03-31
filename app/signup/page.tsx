import AuthForm from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: 'var(--text-primary)' }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'var(--accent)' }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'var(--accent)' }} />

        <div>
          <div className="w-8 h-8 rounded-sm flex items-center justify-center"
            style={{ background: 'var(--accent)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 8-8" />
            </svg>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--bg)' }}>
            Start with<br />a clean<br />slate.
          </h1>
          <p className="text-base" style={{ color: '#a89e8e' }}>
            Your tasks, your priorities,<br />your pace.
          </p>
        </div>

        <p className="text-xs" style={{ color: '#4a4540' }}>© {new Date().getFullYear()} Todos</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 animate-fade-up">
            <h2 className="text-2xl font-semibold mb-1"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Create account
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Get started for free</p>
          </div>
          <AuthForm mode="signup" />
        </div>
      </div>
    </div>
  );
}
