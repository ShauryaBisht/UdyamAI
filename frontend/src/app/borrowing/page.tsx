'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getBorrowings, createBorrowing } from '@/lib/api';
import { Landmark, Plus, Loader2, X, Search, Clock, CheckCircle2, XCircle, Lightbulb, ShieldCheck, ArrowUpRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { useTranslation } from '@/stores/languageStore';
import BorrowingDistributionChart from '@/components/charts/BorrowingDistributionChart';

export default function BorrowingPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ lender_name: '', loan_type: 'mudra', requested_amount: '', interest_rate: '', tenure_months: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  async function loadData() {
    try {
      setLoading(true);
      setData(await getBorrowings(profileId));
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lender_name || !form.requested_amount) return;
    setSubmitting(true);
    try {
      await createBorrowing(profileId, {
        ...form,
        requested_amount: parseFloat(form.requested_amount),
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : undefined,
        tenure_months: form.tenure_months ? parseInt(form.tenure_months) : undefined,
      });
      setForm({ lender_name: '', loan_type: 'mudra', requested_amount: '', interest_rate: '', tenure_months: '', notes: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function fmt(a: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a);
  }

  const statusConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    exploring: { icon: Search, color: 'text-primary dark:text-emerald-400', bg: 'bg-primary-50 dark:bg-primary/10', border: 'border-primary-200 dark:border-primary/20' },
    applied: { icon: Clock, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
    under_review: { icon: Clock, color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
    approved: { icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
    disbursed: { icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
    rejected: { icon: XCircle, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
  };

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] p-8 sm:p-10 text-white shadow-fintech-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold mb-4">
                <Landmark className="h-3.5 w-3.5 text-mint" /> {t('borrowing.badge')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{t('borrowing.title')}</h1>
              <p className="text-white/80 text-sm sm:text-base mt-2 font-normal">
                {t('borrowing.desc')}
              </p>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-primary font-bold text-sm shadow-fintech-btn hover:bg-neutral-50 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> {t('borrowing.add')}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark shadow-subtle flex flex-col justify-between transition-colors">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{t('borrowing.exploring')}</span>
            <div className="mt-2 text-3xl font-black text-foreground dark:text-foreground-dark tracking-tight">{data?.exploring_count ?? 0}</div>
            <p className="text-xs text-foreground-muted mt-1">Schemes in discovery</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark shadow-subtle flex flex-col justify-between transition-colors">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{t('borrowing.applied')}</span>
            <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{data?.applied_count ?? 0}</div>
            <p className="text-xs text-foreground-muted mt-1">Pending lender review</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark shadow-subtle flex flex-col justify-between transition-colors">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{t('borrowing.approved')}</span>
            <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{data?.approved_count ?? 0}</div>
            <p className="text-xs text-foreground-muted mt-1">Sanctioned facilities</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark shadow-subtle flex flex-col justify-between transition-colors">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">{t('borrowing.totalRequested')}</span>
            <div className="mt-2 text-3xl font-black text-primary dark:text-emerald-400 tracking-tight">{data ? fmt(data.total_requested) : '—'}</div>
            <p className="text-xs text-foreground-muted mt-1">Cumulative loan pipeline</p>
          </div>
        </div>

        {/* Borrowing Pipeline Distribution Chart */}
        {data?.borrowings && data.borrowings.length > 0 && (
          <BorrowingDistributionChart
            records={data.borrowings.map((b: any) => ({
              purpose: b.lender_name || b.loan_type,
              amount: Number(b.requested_amount) || 0,
              status: b.status,
            }))}
          />
        )}

        {/* Guidance Card */}
        <div className="bg-gradient-to-r from-primary-50/50 to-indigo-50/40 dark:from-primary/10 dark:to-indigo-950/20 rounded-2xl border border-primary-100 dark:border-primary/20 p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">Rural & MSME Borrowing Best Practices</h3>
              <ul className="text-xs sm:text-sm text-foreground-muted space-y-1 pt-1">
                <li>• Prioritize interest-subvention schemes (PMEGP, MUDRA Shishu/Kishor) before high-interest NBFC loans.</li>
                <li>• Maintain on-time repayment history to build a strong formal credit bureau profile (CIBIL/CRIF).</li>
                <li>• Keep your Aadhaar, PAN, GSTIN / Udyam registration, and 6 months bank statement ready.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border-dark">
                <div>
                  <h3 className="text-lg font-bold text-foreground dark:text-foreground-dark">Add Loan / Borrowing Record</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">Register a new credit or loan application for AI tracking</p>
                </div>
                <button type="button" onClick={() => setShowAdd(false)} className="p-2 text-foreground-muted hover:text-foreground dark:hover:text-foreground-dark hover:bg-neutral-100 dark:hover:bg-surface-dark-elevated rounded-full transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Lender / Bank Name</label>
                  <input
                    type="text"
                    value={form.lender_name}
                    onChange={(e) => setForm({ ...form, lender_name: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="e.g. State Bank of India, NABARD RRB"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Loan Scheme / Type</label>
                  <select
                    value={form.loan_type}
                    onChange={(e) => setForm({ ...form, loan_type: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                  >
                    <option value="mudra">MUDRA (Shishu/Kishor/Tarun)</option>
                    <option value="pmegp">PMEGP Scheme</option>
                    <option value="kcc">Kisan Credit Card (KCC)</option>
                    <option value="term_loan">Term Loan</option>
                    <option value="working_capital">Working Capital</option>
                    <option value="gold_loan">Gold Loan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Requested Amount (₹)</label>
                  <input
                    type="number"
                    value={form.requested_amount}
                    onChange={(e) => setForm({ ...form, requested_amount: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="e.g. 250000"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted mb-2 block uppercase tracking-wider">Expected Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.interest_rate}
                    onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition text-foreground dark:text-foreground-dark"
                    placeholder="e.g. 7.5"
                  />
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
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content Listing */}
        {loading ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium text-foreground-muted">Loading loan records...</p>
          </div>
        ) : !data?.borrowings?.length ? (
          <div className="bg-white dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-surface-dark-elevated flex items-center justify-center mx-auto mb-4 text-foreground-muted">
              <Landmark className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">{t('borrowing.noRecords')}</h3>
            <p className="text-sm text-foreground-muted mt-1 max-w-sm mx-auto">{t('borrowing.noRecordsDesc')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.borrowings.map((b: any) => {
              const sc = statusConfig[b.status] || statusConfig.exploring;
              const Icon = sc.icon;
              return (
                <div key={b.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-6 shadow-subtle hover:border-primary-200 dark:hover:border-primary/40 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary/10 text-primary dark:text-emerald-400 flex items-center justify-center">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground dark:text-foreground-dark text-base">{b.lender_name}</h3>
                        <p className="text-xs text-foreground-muted font-medium capitalize">{b.loan_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${sc.bg} ${sc.color} ${sc.border} inline-flex items-center gap-1.5`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="capitalize">{b.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border dark:border-border-dark">
                    <div>
                      <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Type</p>
                      <p className="font-bold text-foreground dark:text-foreground-dark text-sm mt-0.5">{b.loan_type.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Requested</p>
                      <p className="font-bold text-foreground dark:text-foreground-dark text-base mt-0.5">{fmt(b.requested_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Approved</p>
                      <p className="font-bold text-primary dark:text-emerald-400 text-base mt-0.5">{b.approved_amount ? fmt(b.approved_amount) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Rate</p>
                      <p className="font-bold text-foreground dark:text-foreground-dark text-sm mt-0.5">{b.interest_rate ? `${b.interest_rate}% p.a.` : '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
