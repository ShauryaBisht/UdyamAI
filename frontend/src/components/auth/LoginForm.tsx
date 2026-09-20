'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/stores/languageStore';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type Mode = 'signin' | 'signup';

export default function LoginForm() {
  const router = useRouter();
  const t = useLanguageStore((s) => s.t);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setError('');
    setInfo('');

    if (!EMAIL_PATTERN.test(email)) {
      setError(t('login.invalidEmail'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('login.passwordShort'));
      return;
    }
    if (!isSupabaseConfigured()) {
      setError(t('login.notConfigured'));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();

      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          console.error('Sign-in failed:', signInError);
          setError(t('login.authFailed'));
          return;
        }
        router.push('/setup');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          router.push('/setup');
        } else {
          switchMode('signin');
          setInfo(t('login.confirmEmail'));
        }
      }
    } catch (err: any) {
      console.error('Authentication failed:', err);
      setError(err?.message || t('login.authFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {mode === 'signin' ? t('login.welcome') : t('login.createAccount')}
        </h2>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-foreground-muted">{t('login.subtitle')}</p>

      {/* Mode switcher pill tabs */}
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1.5 border border-slate-200/60">
        <button
          type="button"
          onClick={() => switchMode('signin')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
            mode === 'signin'
              ? 'bg-white text-primary shadow-sm font-black'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          {t('login.signIn')}
        </button>
        <button
          type="button"
          onClick={() => switchMode('signup')}
          className={`py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
            mode === 'signup'
              ? 'bg-white text-primary shadow-sm font-black'
              : 'text-foreground-muted hover:text-foreground'
          }`}
        >
          {t('login.signUp')}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {t('login.email')}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.trim());
                setError('');
              }}
              placeholder={t('login.placeholder')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {t('login.password')}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden="true"
            />
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={t('login.passwordPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>
        </div>

        {info && (
          <p className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs sm:text-sm font-semibold text-primary">
            {info}
          </p>
        )}
        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs sm:text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-bold text-white shadow-fintech-btn transition-all duration-200 hover:bg-primary-600 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <>
            {mode === 'signin' ? t('login.signIn') : t('login.signUp')}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-5 text-center text-xs text-foreground-subtle">{t('login.authNote')}</p>
    </form>
  );
}
