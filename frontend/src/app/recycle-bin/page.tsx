'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getRecycleBin, restoreFromRecycleBin, permanentDeleteRecycleBin } from '@/lib/api';
import {
  Trash2, RotateCcw, AlertTriangle, Loader2, Inbox,
  Receipt, Wallet, PiggyBank, Target, Landmark, HandCoins, CreditCard, FileText,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/stores/languageStore';

const ITEM_TYPE_ICONS: Record<string, LucideIcon> = {
  expense: Receipt,
  cash_flow: Wallet,
  savings_goal: PiggyBank,
  budget: Target,
  debt: Landmark,
  borrowing: HandCoins,
  credit_score: CreditCard,
};

export default function RecycleBinPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRecycleBin(profileId);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRestore() {
    if (!selected.length) return;
    try {
      await restoreFromRecycleBin(selected);
      setSelected([]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePermanentDelete(id: string) {
    try {
      await permanentDeleteRecycleBin(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <AppShell>
      <main className="flex-1 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] p-8 sm:p-10 text-white shadow-fintech-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold mb-4">
                <Trash2 className="h-3.5 w-3.5 text-mint" /> {t('nav.recyclebin')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('recyclebin.title')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('recyclebin.desc')}
              </p>
            </div>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="bg-primary-50 dark:bg-primary/10 rounded-2xl border border-primary-200 dark:border-primary/20 p-4 flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-primary dark:text-emerald-400">{selected.length} record(s) selected</span>
            <button
              onClick={handleRestore}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-full text-xs sm:text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition"
            >
              <RotateCcw className="h-4 w-4" /> {t('recyclebin.restore')}
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 flex flex-col items-center justify-center shadow-subtle">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground-muted">Loading recycle bin...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 text-center shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-surface-dark-elevated flex items-center justify-center mx-auto mb-4 text-foreground-muted">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">{t('recyclebin.empty')}</h3>
            <p className="text-sm text-foreground-muted mt-1 max-w-sm mx-auto">Deleted financial items will appear here for 30 days before permanent purging.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const ItemIcon = ITEM_TYPE_ICONS[item.item_type] || FileText;
              return (
                <div key={item.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-5 shadow-subtle flex items-center justify-between hover:border-primary-200 dark:hover:border-primary/40 transition">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary/10 border border-primary-100 dark:border-primary/20 text-primary dark:text-emerald-400">
                      <ItemIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground dark:text-foreground-dark text-sm sm:text-base capitalize">{item.item_type.replace(/_/g, ' ')}</h4>
                      <p className="text-xs text-foreground-muted mt-0.5">Deleted on {new Date(item.deleted_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreFromRecycleBin([item.id]).then(loadData)}
                      className="p-2.5 text-primary dark:text-emerald-400 hover:bg-primary-50 dark:hover:bg-primary/10 rounded-xl transition"
                      title="Restore record"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      className="p-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-neutral-50 dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground dark:text-foreground-dark">Permanent Deletion Policy</p>
              <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
                Items manually deleted cannot be restored. Records in the recycle bin are automatically purged after 30 calendar days.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

