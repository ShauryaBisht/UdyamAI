'use client';

import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useLanguageStore } from '@/stores/languageStore';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const t = useLanguageStore((s) => s.t);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 glow-mesh-hero">
      {/* Background glow halos */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo variant="icon" size="xl" href="/" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Udyam<span className="text-primary font-bold">AI</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-foreground-muted">{t('login.tagline')}</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
