'use client';

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslation } from '@/stores/languageStore';

export default function OfflineBanner() {
  const { isOnline, justReconnected } = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <div className="bg-emerald-500/90 dark:bg-emerald-600/90 text-white text-xs md:text-sm font-medium py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md backdrop-blur-md sticky top-0 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
        <Wifi className="w-4 h-4 animate-pulse text-emerald-200" />
        <span>{t('offline.backOnline')}</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600/95 dark:bg-amber-500/95 text-slate-950 text-xs md:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2.5 shadow-lg backdrop-blur-md sticky top-0 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <WifiOff className="w-4 h-4 text-slate-950 animate-bounce" />
      <span>{t('offline.warning')}</span>
      <span className="hidden sm:inline text-xs font-normal opacity-90 border-l border-slate-950/30 pl-2 ml-1">
        {t('offline.subtitle')}
      </span>
    </div>
  );
}

