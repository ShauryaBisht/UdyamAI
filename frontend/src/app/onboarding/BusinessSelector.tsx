'use client';

import { useEffect, useState } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { getBusinessCategories, BusinessCategory } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';

interface BusinessSelectorProps {
  businessCategoryId: string;
  setBusinessCategoryId: (id: string, name?: string) => void;
}

export default function BusinessSelector({
  businessCategoryId,
  setBusinessCategoryId,
}: BusinessSelectorProps) {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const t = useLanguageStore((s) => s.t);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      setLoadError(null);
      try {
        const apiCategories = await getBusinessCategories();
        setCategories(apiCategories.filter((c) => c.active !== false));
        if (apiCategories.length === 0) {
          setLoadError(t('onboard.noBusiness'));
        }
      } catch {
        setLoadError(t('onboard.failBusiness'));
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [t]);

  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm">
        <Store size={20} aria-hidden="true" />
      </div>

      <div className="w-full">
        <h4 className="font-bold text-foreground text-sm sm:text-base">
          {t('onboard.bizTitle')}
        </h4>

        <p className="mt-0.5 text-xs text-foreground-muted">
          {t('onboard.bizDesc')}
        </p>
        {loadError && <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{loadError}</p>}

        <div className="relative mt-4">
          <select
            value={businessCategoryId}
            onChange={(e) => {
              const id = e.target.value;
              const found = categories.find((c) => c.id === id);
              setBusinessCategoryId(id, found?.name || '');
            }}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 dark:border-[#2B313C] bg-slate-50/50 dark:bg-[#1C2128] px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white dark:focus:bg-[#222731] focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 dark:disabled:bg-[#161B22] text-foreground font-medium"
          >
            <option value="">
              {loading ? t('onboard.loadingBusiness') : t('onboard.selectBusiness')}
            </option>
            {categories.map((item) => (
              <option key={item.id} value={item.id} className="bg-white dark:bg-[#1C2128] text-foreground">
                {item.name}
              </option>
            ))}
          </select>
          {loading && (
            <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </div>
    </div>
  );
}