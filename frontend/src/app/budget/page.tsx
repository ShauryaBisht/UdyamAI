'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getBudgets, createBudget } from '@/lib/api';
import { ClipboardList, Plus, Loader2, X, Target } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { useTranslation } from '@/stores/languageStore';
import BudgetComparisonChart from '@/components/charts/BudgetComparisonChart';

export default function BudgetPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', period_type: 'monthly', start_date: '', end_date: '', total_income_target: '', total_expense_target: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setData(await getBudgets(profileId));
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
    if (!form.name || !form.start_date || !form.end_date) return;
    setSubmitting(true);
    try {
      await createBudget(profileId, {
        name: form.name,
        period_type: form.period_type,
        start_date: form.start_date,
        end_date: form.end_date,
        total_income_target: parseFloat(form.total_income_target) || 0,
        total_expense_target: parseFloat(form.total_expense_target) || 0,
        items: [],
      });
      setForm({ name: '', period_type: 'monthly', start_date: '', end_date: '', total_income_target: '', total_expense_target: '' });
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

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] text-white p-7 sm:p-10 shadow-fintech-card relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white/90 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <Target className="h-3.5 w-3.5 text-mint" /> {t('budget.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('budget.title')}</h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed font-normal">
              {t('budget.desc')}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Active Budget Plans"
              value={data?.active_count ?? 0}
              size="md"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Budgeted Revenue Target"
              value={data ? fmt(data.total_budgeted_income) : '—'}
              scoreVariant="verified"
              size="md"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Budgeted Expense Cap"
              value={data ? fmt(data.total_budgeted_expenses) : '—'}
              scoreVariant="accent"
              size="md"
            />
          </Card>
        </div>

        {/* Budget vs Actual Comparison Chart */}
        {data?.budgets && data.budgets.length > 0 && (
          <BudgetComparisonChart
            items={data.budgets.flatMap((b: any) =>
              b.items && b.items.length > 0
                ? b.items.map((it: any) => ({
                    category: it.category || it.name,
                    budgetLimit: Number(it.budget_limit || it.allocated_amount || it.target_amount) || 0,
                    actualSpent: Number(it.actual_spent || it.spent_amount) || 0,
                  }))
                : [
                    {
                      category: `${b.name} (Expense Cap)`,
                      budgetLimit: Number(b.total_expense_target) || 0,
                      actualSpent: Number(b.total_actual_expenses) || 0,
                    },
                  ]
            )}
          />
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-xs sm:text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition"
          >
            <Plus className="h-4 w-4" /> Create New Budget
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="rounded-[24px] border border-primary/20 bg-slate-50/70 p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-foreground">Create Fiscal Budget</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Budget Title</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Kharif 2026 Crop Cycle"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Period Type</label>
                  <select
                    value={form.period_type}
                    onChange={(e) => setForm({ ...form, period_type: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="monthly">Monthly Cycle</option>
                    <option value="quarterly">Quarterly Cycle</option>
                    <option value="seasonal">Seasonal / Crop Cycle</option>
                    <option value="yearly">Annual Fiscal Year</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Target Revenue (₹)</label>
                  <input
                    type="number"
                    value={form.total_income_target}
                    onChange={(e) => setForm({ ...form, total_income_target: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="e.g. 500000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Cap On Expenses (₹)</label>
                  <input
                    type="number"
                    value={form.total_expense_target}
                    onChange={(e) => setForm({ ...form, total_expense_target: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="e.g. 280000"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-fintech-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Budget Plan
              </button>
            </form>
          </div>
        )}

        {/* Budgets List */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-white p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading budgets...</p>
          </div>
        ) : !data?.budgets?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/50 p-12 text-center">
            <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-foreground font-bold text-base">No budget plans created yet.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Establish monthly or seasonal targets to monitor cashflow performance.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.budgets.map((b: any) => (
              <div key={b.id} className="rounded-[24px] border border-border bg-white p-6 shadow-subtle hover:border-primary/30 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">{b.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="capitalize font-semibold text-primary">{b.period_type}</span> • {new Date(b.start_date).toLocaleDateString('en-IN')} to {new Date(b.end_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${b.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-muted-foreground'}`}>
                    {b.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Income Target</p>
                    <p className="font-financial font-extrabold text-primary text-base mt-0.5">{fmt(b.total_income_target)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense Cap</p>
                    <p className="font-financial font-extrabold text-rose-600 text-base mt-0.5">{fmt(b.total_expense_target)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual Inflow</p>
                    <p className="font-financial font-bold text-foreground text-base mt-0.5">{fmt(b.total_actual_income)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual Outflow</p>
                    <p className="font-financial font-bold text-foreground text-base mt-0.5">{fmt(b.total_actual_expenses)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

