'use client';

import { Wallet } from 'lucide-react';
import { LANGUAGE_OPTIONS, type Language } from '@/lib/i18n';
import { useLanguageStore } from '@/stores/languageStore';

interface FinancialFormProps {
  capital: string;
  desiredProjectCost: string;
  language: string;
  setCapital: (value: string) => void;
  setDesiredProjectCost: (value: string) => void;
  setLanguage: (value: Language) => void;
}

export default function FinancialForm({
  capital,
  desiredProjectCost,
  language,
  setCapital,
  setDesiredProjectCost,
  setLanguage,
}: FinancialFormProps) {
  const t = useLanguageStore((s) => s.t);
  const setGlobalLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 shadow-sm">
        <Wallet size={20} aria-hidden="true" />
      </div>

      <div className="w-full space-y-4">
        <div>
          <h4 className="font-bold text-foreground text-sm sm:text-base">{t('onboard.finTitle')}</h4>
          <p className="mt-0.5 text-xs text-foreground-muted">{t('onboard.finDesc')}</p>
        </div>

        <div>
          <label htmlFor="capital" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {t('onboard.capitalLabel') || 'Available Capital (₹)'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground-muted">
              ₹
            </span>
            <input
              id="capital"
              type="number"
              min="0"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              placeholder={t('onboard.capitalPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 text-foreground font-financial font-bold placeholder:text-foreground-subtle"
            />
          </div>
        </div>

        <div>
          <label htmlFor="desiredProjectCost" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {t('onboard.projectCost')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground-muted">
              ₹
            </span>
            <input
              id="desiredProjectCost"
              type="number"
              min="1"
              value={desiredProjectCost}
              onChange={(e) => setDesiredProjectCost(e.target.value)}
              placeholder={t('onboard.projectPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] py-3.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 text-foreground font-financial font-bold placeholder:text-foreground-subtle"
            />
          </div>
        </div>

        <div>
          <label htmlFor="language" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {t('lang.label')}
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => {
              const value = e.target.value as Language;
              setLanguage(value);
              setGlobalLanguage(value);
            }}
            className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 text-foreground font-medium"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1C2128] text-foreground">
                {t(`lang.${opt.value}`)} ({opt.nativeLabel})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
