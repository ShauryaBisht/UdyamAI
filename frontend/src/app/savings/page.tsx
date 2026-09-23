'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getSavings, createSavingsGoal, addSavingsTransaction } from '@/lib/api';
import { PiggyBank, Plus, Target, TrendingUp, X, Check, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { useTranslation } from '@/stores/languageStore';
import SavingsProgressChart from '@/components/charts/SavingsProgressChart';

export default function SavingsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTxn, setShowTxn] = useState<string | null>(null);
  const [txnForm, setTxnForm] = useState({ transaction_type: 'deposit' as 'deposit' | 'withdrawal', amount: '', notes: '' });
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', target_date: '', priority: 'medium' as 'high' | 'medium' | 'low', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSavings(profileId);
      setData(res);
    } catch (err) {
      console.warn('Failed to load savings:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.target_amount) return;
    setSubmitting(true);
    try {
      await createSavingsGoal(profileId, {
        name: form.name,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount || '0'),
        target_date: form.target_date || undefined,
        priority: form.priority,
        notes: form.notes || undefined,
      });
      setForm({ name: '', target_amount: '', current_amount: '0', target_date: '', priority: 'medium', notes: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error('Failed to add goal:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTxn(e: React.FormEvent) {
    e.preventDefault();
    if (!showTxn || !txnForm.amount) return;
    setSubmitting(true);
    try {
      await addSavingsTransaction(showTxn, {
        transaction_type: txnForm.transaction_type,
        amount: parseFloat(txnForm.amount),
        notes: txnForm.notes || undefined,
      });
      setShowTxn(null);
      setTxnForm({ transaction_type: 'deposit', amount: '', notes: '' });
      loadData();
    } catch (err) {
      console.error('Failed to record transaction:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function fmt(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  const goals = data?.goals || [];
  const priorityColors: Record<string, string> = {
    high: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    medium: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    low: 'bg-primary/10 text-primary dark:text-emerald-400 border-primary/20',
  };

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] text-white p-7 sm:p-10 shadow-fintech-card relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white/90 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <PiggyBank className="h-3.5 w-3.5 text-mint" /> {t('savings.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('savings.title')}</h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed font-normal">
              {t('savings.desc')}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="flex flex-col justify-between p-6">
            <MetricDisplay
              label={t('savings.totalSaved') || 'Total Capital Saved'}
              value={fmt(data?.total_saved ?? 0)}
              subtext="Aggregated across all targets"
              scoreVariant="primary"
            />
          </Card>
          <Card className="flex flex-col justify-between p-6">
            <MetricDisplay
              label={t('savings.accumulatedTarget') || 'Accumulated Target'}
              value={fmt(data?.total_target ?? 0)}
              subtext="Total goals allocation"
              scoreVariant="neutral"
            />
          </Card>
          <Card className="flex flex-col justify-between p-6">
            <MetricDisplay
              label={t('savings.overallProgress') || 'Overall Savings Progress'}
              value={`${Math.round(data?.overall_progress ?? 0)}%`}
              subtext="Completed goal readiness"
              scoreVariant="verified"
            />
          </Card>
        </div>

        {/* Savings Goal Accumulation Chart */}
        {data?.goals && data.goals.length > 0 && (
          <SavingsProgressChart
            goals={data.goals.map((g: any) => ({
              title: g.name || 'Savings Target',
              targetAmount: Number(g.target_amount) || 0,
              currentAmount: Number(g.current_amount) || 0,
              targetDate: g.target_date,
            }))}
          />
        )}

        {/* Top Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Target Capital Goals</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Define milestones for equipment purchases, working capital buffers, and repairs</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition"
          >
            <Plus className="h-4 w-4" /> New Savings Target
          </button>
        </div>

        {/* Add Goal Form */}
        {showAdd && (
          <div className="rounded-[24px] border border-primary/20 bg-slate-50/70 dark:bg-surface-dark p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-border-dark pb-3">
                <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">Set New Savings Goal</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground dark:hover:text-foreground-dark">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Goal Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground dark:text-foreground-dark"
                    placeholder="e.g. Solar Cold Storage Reserve"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold text-foreground dark:text-foreground-dark"
                    placeholder="e.g. 150000"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground dark:text-foreground-dark"
                  >
                    <option value="high">Critical / High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Long Term / Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground dark:text-foreground-dark"
                    placeholder="Target date or milestone details"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 shadow-fintech-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Goal'}
              </button>
            </form>
          </div>
        )}

        {/* Add Transaction Form */}
        {showTxn && (
          <div className="rounded-[24px] border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleTxn} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-800/60 pb-3">
                <h3 className="text-base font-bold text-foreground dark:text-foreground-dark">Record Savings Deposit / Withdrawal</h3>
                <button type="button" onClick={() => setShowTxn(null)} className="text-muted-foreground hover:text-foreground dark:hover:text-foreground-dark">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Transaction Type</label>
                  <select
                    value={txnForm.transaction_type}
                    onChange={(e) => setTxnForm({ ...txnForm, transaction_type: e.target.value as any })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold text-foreground dark:text-foreground-dark"
                  >
                    <option value="deposit">Deposit (+) Into Goal</option>
                    <option value="withdrawal">Withdrawal (-) From Goal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Amount (₹)</label>
                  <input
                    type="number"
                    value={txnForm.amount}
                    onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold text-foreground dark:text-foreground-dark"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Notes</label>
                  <input
                    type="text"
                    value={txnForm.notes}
                    onChange={(e) => setTxnForm({ ...txnForm, notes: e.target.value })}
                    className="w-full rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark-elevated px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground dark:text-foreground-dark"
                    placeholder="e.g. Harvest surplus"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 shadow-fintech-btn"
              >
                Save Transaction
              </button>
            </form>
          </div>
        )}

        {/* Goals Listing */}
        {loading ? (
          <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading savings records...</p>
          </div>
        ) : !data?.goals?.length ? (
          <div className="rounded-2xl border border-dashed border-border dark:border-border-dark bg-slate-50/50 dark:bg-surface-dark p-12 text-center">
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-foreground dark:text-foreground-dark font-bold text-base">No savings goals created yet.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Create targets for equipment, drip irrigation, or working capital reserves.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.goals.map((goal: any) => (
              <div key={goal.id} className="rounded-[24px] border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-6 shadow-subtle hover:border-primary/30 dark:hover:border-primary/50 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-foreground-dark">{goal.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${priorityColors[goal.priority] || 'bg-slate-100 dark:bg-surface-dark-elevated text-muted-foreground border-slate-200 dark:border-border-dark'}`}>
                        {goal.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Saved <strong className="text-foreground dark:text-foreground-dark font-financial">{fmt(goal.current_amount)}</strong> of <strong className="text-foreground dark:text-foreground-dark font-financial">{fmt(goal.target_amount)}</strong>
                    </p>
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold font-financial text-primary dark:text-emerald-400">{goal.progress_percent}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-surface-dark-elevated overflow-hidden mb-5">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, goal.progress_percent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border dark:border-border-dark">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${goal.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-surface-dark-elevated text-muted-foreground'}`}>
                    {goal.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setShowTxn(goal.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full text-xs font-semibold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Deposit / Draw
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
