'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getCreditScore, createCreditScore } from '@/lib/api';
import { Shield, TrendingUp, TrendingDown, Minus, Plus, Loader2, X, CheckCircle2, Lightbulb, ArrowUpRight, Award } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTranslation } from '@/stores/languageStore';
import CreditHealthGauge from '@/components/charts/CreditHealthGauge';

export default function CreditPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ score: '', provider: 'estimated', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setData(await getCreditScore(profileId));
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.score) return;
    setSubmitting(true);
    try {
      await createCreditScore(profileId, { score: parseInt(form.score), provider: form.provider, suggestions: form.notes || undefined });
      setForm({ score: '', provider: 'estimated', notes: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function getRatingStatus(score: number): 'verified' | 'warning' | 'risk' {
    if (score >= 700) return 'verified';
    if (score >= 580) return 'warning';
    return 'risk';
  }

  function getRatingLabel(rating: string) {
    const labels: Record<string, string> = { excellent: 'Excellent', very_good: 'Very Good', good: 'Good', fair: 'Fair', poor: 'Poor', not_rated: 'Not Rated' };
    return labels[rating] || rating;
  }

  function getTrendIcon(trend: string) {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
    return <Minus className="h-4 w-4 text-foreground-muted" />;
  }

  const defaultSuggestions = [
    'Ensure all agricultural and commercial loan EMIs are settled before their due dates.',
    'Keep your overall credit utilization well below 30% of authorized institutional limits.',
    'Maintain a balanced mix of formal banking facilities and avoid unorganized moneylenders.',
    'Periodically review your CIBIL / CRIF report for any erroneous late-payment records.',
    'Ensure active Kisan Credit Card (KCC) or overdraft accounts remain within valid limits.',
  ];

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] p-8 sm:p-10 text-white shadow-fintech-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold mb-4">
                <Shield className="h-3.5 w-3.5 text-mint" /> {t('credit.badge')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('credit.title')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('credit.desc')}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-primary font-bold text-sm shadow-fintech-btn hover:bg-neutral-50 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> {t('credit.record')}
            </button>
          </div>
        </div>

        {/* Credit Score Display */}
        {data?.latest_score ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-8 sm:p-10 shadow-subtle transition-colors">
            <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-12">
              {/* Score Circular Badge */}
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-primary-50/70 dark:bg-primary/15 border-4 border-primary/20 dark:border-primary/30 shadow-inner shrink-0">
                <div className="text-center">
                  <p className="text-4xl sm:text-5xl font-black text-primary dark:text-emerald-400 tracking-tight">{data.latest_score.score}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mt-0.5">out of 900</p>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-foreground-dark">{getRatingLabel(data.rating)}</h2>
                  <StatusBadge
                    status={getRatingStatus(data.latest_score.score)}
                    label={getRatingLabel(data.rating)}
                    size="md"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-surface-dark-elevated text-foreground dark:text-foreground-dark">
                    {getTrendIcon(data.trend)}
                    <span className="capitalize">{data.trend} Trend</span>
                  </div>
                </div>

                <p className="text-sm text-foreground-muted">
                  Bureau Source: <strong className="text-foreground dark:text-foreground-dark">{data.latest_score.provider.toUpperCase()}</strong> • Last Checked: {new Date(data.latest_score.recorded_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="flex gap-2.5 justify-center md:justify-start flex-wrap pt-2">
                  <span className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 border border-primary-100 dark:border-primary/20">
                    Active Score: {data.latest_score.score}
                  </span>
                  <span className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-neutral-100 dark:bg-surface-dark-elevated text-foreground-muted border border-border dark:border-border-dark">
                    {data.history?.length || 1} Audited Record(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 text-center shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-surface-dark-elevated flex items-center justify-center mx-auto mb-4 text-foreground-muted">
              <Shield className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">No credit score recorded yet</h3>
            <p className="text-sm text-foreground-muted mt-1 max-w-sm mx-auto">Record your estimated or official bureau credit score to start monitoring eligibility.</p>
          </div>
        )}

        {/* Credit Health Gauge Visualizer */}
        <CreditHealthGauge
          score={data?.latest_score?.score ?? 720}
          utilizationRate={data?.utilization_rate ?? 28}
        />

        {/* Score History */}
        {data?.history?.length > 1 && (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-foreground dark:text-foreground-dark mb-6">Historical Score Progression</h3>
            <div className="flex items-end gap-5 overflow-x-auto pb-4">
              {data.history.slice(0, 12).reverse().map((s: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
                  <div
                    className="w-12 rounded-t-xl bg-gradient-to-t from-primary-600 to-primary transition-all hover:opacity-90 shadow-sm"
                    style={{ height: `${Math.max(32, (s.score / 900) * 120)}px` }}
                  />
                  <span className="text-xs font-black text-foreground dark:text-foreground-dark">{s.score}</span>
                  <span className="text-[11px] font-medium text-foreground-muted">{new Date(s.recorded_date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        <div className="bg-gradient-to-r from-primary-50/50 to-indigo-50/40 dark:from-primary/10 dark:to-indigo-950/20 rounded-2xl border border-primary-100 dark:border-primary/20 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">{t('credit.suggestionsTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {(data?.suggestions?.length ? data.suggestions : defaultSuggestions).map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 bg-white/80 dark:bg-surface-dark p-3.5 rounded-xl border border-primary-100/60 dark:border-border-dark">
                    <CheckCircle2 className="h-4 w-4 text-primary dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-foreground dark:text-foreground-dark font-medium leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border-dark">
                <div>
                  <h3 className="text-lg font-bold text-foreground dark:text-foreground-dark">Record Credit Score</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">Enter latest credit bureau assessment for loan readiness tracking</p>
                </div>
                <button type="button" onClick={() => setShowAdd(false)} className="p-2 text-foreground-muted hover:text-foreground dark:hover:text-foreground-dark hover:bg-neutral-100 dark:hover:bg-surface-dark-elevated rounded-full transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Credit Score (300 - 900)</label>
                  <input
                    type="number"
                    value={form.score}
                    onChange={(e) => setForm({ ...form, score: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    min={300}
                    max={900}
                    placeholder="e.g. 745"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Bureau Agency</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="estimated">Self Estimated / AI Score</option>
                    <option value="cibil">TransUnion CIBIL</option>
                    <option value="equifax">Equifax India</option>
                    <option value="crif">CRIF High Mark</option>
                    <option value="experian">Experian India</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 rounded-full border border-border dark:border-border-dark text-foreground dark:text-foreground-dark font-semibold text-sm hover:bg-neutral-50 dark:hover:bg-surface-dark-elevated transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 shadow-fintech-btn flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Credit Score'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </AppShell>
  );
}
