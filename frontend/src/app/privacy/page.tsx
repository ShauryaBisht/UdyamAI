'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getPrivacy, updatePrivacyConsent } from '@/lib/api';
import { Shield, Loader2, CheckCircle2, XCircle, Lock, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/stores/languageStore';

const CONSENT_TYPES = [
  { type: 'data_sharing', title: 'Institutional Scheme Verification', desc: 'Permit sharing verified profile details with KVIC/MSME agencies for direct subsidy qualification.' },
  { type: 'analytics', title: 'Anonymous Micro-Enterprise Insights', desc: 'Share de-identified operational benchmarks to help improve rural cluster models.' },
  { type: 'marketing', title: 'Subsidies & Mandi Price Alerts', desc: 'Receive real-time notifications about seasonal government schemes and MSP price alerts.' },
  { type: 'ai_processing', title: 'AI Business Optimization Engine', desc: 'Allow Gemini AI models to analyze unit costs and generate localized cashflow recommendations.' },
  { type: 'third_party_sharing', title: 'Bank Lending Matching', desc: 'Share loan readiness documents with public sector banks (SBI, NABARD RRBs) upon loan application.' },
];

export default function PrivacyPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setData(await getPrivacy(profileId));
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggle(type: string, current: boolean) {
    setUpdating(type);
    try {
      await updatePrivacyConsent(profileId, type, !current);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  }

  function isGranted(type: string): boolean {
    return data?.consents?.find((c: any) => c.consent_type === type)?.granted || false;
  }

  return (
    <AppShell>
      <main className="flex-1 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] p-8 sm:p-10 text-white shadow-fintech-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold mb-4">
                <Shield className="h-3.5 w-3.5 text-mint" /> {t('nav.privacy')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('privacy.title')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('privacy.ownership')}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 flex flex-col items-center justify-center shadow-subtle">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground-muted">Loading privacy configurations...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {CONSENT_TYPES.map(ct => {
              const granted = isGranted(ct.type);
              const isUpdating = updating === ct.type;
              return (
                <div key={ct.type} className="bg-white dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-6 shadow-subtle hover:border-primary-200 dark:hover:border-primary/40 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">{ct.title}</h3>
                      <p className="text-sm text-foreground-muted mt-1 leading-relaxed">{ct.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(ct.type, granted)}
                      disabled={isUpdating}
                      className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${granted ? 'bg-primary' : 'bg-neutral-200 dark:bg-surface-dark-elevated'} ${isUpdating ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${granted ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border dark:border-border-dark">
                    {granted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-foreground-muted" />
                    )}
                    <span className={`text-xs font-bold ${granted ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground-muted'}`}>
                      {granted ? 'Authorized by Enterprise' : 'Permission Revoked / Inactive'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-gradient-to-r from-primary-50/50 to-indigo-50/40 dark:from-primary/10 dark:to-indigo-950/20 rounded-2xl border border-primary-100 dark:border-primary/20 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground dark:text-foreground-dark">256-Bit Enterprise Financial Encryption</p>
              <p className="text-sm text-foreground-muted mt-1 leading-relaxed">
                Your enterprise profiles, revenue statements, and loan records are encrypted at rest and in transit, in compliance with RBI DPDP data governance guidelines.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

