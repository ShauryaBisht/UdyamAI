'use client';

import React from 'react';
import AppShell from '@/components/ui/AppShell';
import Link from 'next/link';
import { useLanguageStore } from '@/stores/languageStore';
import { MessageSquare, ArrowRight, Sparkles, Bot } from 'lucide-react';

export default function ChatPage() {
  const t = useLanguageStore((s) => s.t);
  return (
    <AppShell>
      <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] p-8 sm:p-10 text-white shadow-fintech-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold mb-4">
                <Bot className="h-3.5 w-3.5 text-mint" /> Multilingual AI Advisory
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('module.chatTitle')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('module.chatDesc')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-border p-8 sm:p-12 text-center shadow-subtle transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Interactive AI Assistant</h2>
          <p className="text-sm text-foreground-muted max-w-md mx-auto mt-2 leading-relaxed">
            Use the persistent AI assistant in the bottom-right corner for voice queries in Hindi, Marathi, and English, or navigate to your executive dashboard for full metrics.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold rounded-full shadow-fintech-btn hover:bg-primary-600 transition"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
