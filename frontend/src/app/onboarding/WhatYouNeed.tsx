'use client';

import { useLanguageStore } from '@/stores/languageStore';
import { MapPin, Store, Wallet } from 'lucide-react';

export default function WhatYouNeed() {
  const t = useLanguageStore((s) => s.t);

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-[#2B313C] bg-white dark:bg-[#161B22] p-7 shadow-card space-y-4">
      <h3 className="text-base sm:text-lg font-bold text-foreground">{t('onboard.needTitle')}</h3>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 p-4">
          <div className="flex items-center gap-2 text-primary dark:text-[#34D399] font-bold text-xs uppercase tracking-wider mb-1.5">
            <MapPin className="h-4 w-4" />
            <span>{t('onboard.needLocation')}</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">{t('onboard.needLocationDesc')}</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/30 p-4">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1.5">
            <Store className="h-4 w-4" />
            <span>{t('onboard.needBusiness')}</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">{t('onboard.needBusinessDesc')}</p>
        </div>

        <div className="rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/30 p-4">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-1.5">
            <Wallet className="h-4 w-4" />
            <span>{t('onboard.needCapital')}</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">{t('onboard.needCapitalDesc')}</p>
        </div>
      </div>
    </div>
  );
}
