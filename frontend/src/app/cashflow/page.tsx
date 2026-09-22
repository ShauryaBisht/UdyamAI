'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getCashFlow, createCashFlowEntry } from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Banknote, Plus, X, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { useTranslation } from '@/stores/languageStore';
import CashFlowTrendChart from '@/components/charts/CashFlowTrendChart';

const CATEGORIES = {
  income: ['sales', 'loan_disbursement', 'subsidy_received', 'investment', 'refund', 'other_income'],
  expense: ['rent', 'salaries', 'inventory_purchase', 'utilities', 'transport', 'marketing', 'other_expense'],
};

export default function CashFlowPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ entry_type: 'income' as 'income' | 'expense', category: 'sales', description: '', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  async function loadData() {
    try {
      setLoading(true);
      const result = await getCashFlow(profileId);
      setData(result);
    } catch (err) {
      console.warn('Failed to load cash flow:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    try {
      await createCashFlowEntry(profileId, {
        entry_type: form.entry_type,
        category: form.category,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        notes: form.notes || undefined,
      });
      setForm({ entry_type: 'income', category: 'sales', description: '', amount: '', notes: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  const entries = data?.entries || [];

  const cashFlowChartData = React.useMemo(() => {
    if (!entries || entries.length === 0) {
      if (data?.total_income || data?.total_expenses) {
        return [
          {
            period: 'Current Period',
            inflow: Number(data.total_income) || 0,
            outflow: Number(data.total_expenses) || 0,
            net: (Number(data.total_income) || 0) - (Number(data.total_expenses) || 0),
          },
        ];
      }
      return [];
    }
    const grouped: Record<string, { inflow: number; outflow: number }> = {};
    entries.forEach((e: any) => {
      const period = new Date(e.date || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!grouped[period]) grouped[period] = { inflow: 0, outflow: 0 };
      if (e.entry_type === 'income') grouped[period].inflow += Number(e.amount) || 0;
      else grouped[period].outflow += Number(e.amount) || 0;
    });
    return Object.entries(grouped).map(([period, val]) => ({
      period,
      inflow: val.inflow,
      outflow: val.outflow,
      net: val.inflow - val.outflow,
    }));
  }, [entries, data]);

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] text-white p-7 sm:p-10 shadow-fintech-card relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white/90 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <Banknote className="h-3.5 w-3.5 text-mint" /> {t('cashflow.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('cashflow.title')}</h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed font-normal">
              {t('cashflow.desc')}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label={t('cashflow.inflow')}
              value={data ? formatCurrency(data.total_income) : '—'}
              scoreVariant="verified"
              size="md"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label={t('cashflow.outflow')}
              value={data ? formatCurrency(data.total_expenses) : '—'}
              scoreVariant="risk"
              size="md"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label={t('cashflow.net')}
              value={data ? formatCurrency(data.net_cash_flow) : '—'}
              scoreVariant={(data?.net_cash_flow || 0) >= 0 ? 'verified' : 'risk'}
              size="md"
            />
          </Card>
        </div>

        {/* Cash Flow Dynamics Trend Chart */}
        {cashFlowChartData.length > 0 && (
          <CashFlowTrendChart data={cashFlowChartData} />
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-xs sm:text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition"
          >
            <Plus className="h-4 w-4" /> {t('cashflow.record')}
          </button>
        </div>

        {/* Add Entry Form */}
        {showAdd && (
          <div className="rounded-[24px] border border-primary/20 bg-slate-50/70 p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-foreground">Record Inflow / Outflow</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Entry Flow Type</label>
                  <select
                    value={form.entry_type}
                    onChange={(e) => {
                      const v = e.target.value as 'income' | 'expense';
                      setForm({ ...form, entry_type: v, category: CATEGORIES[v][0] });
                    }}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
                  >
                    <option value="income">Inflow (+) Revenue / Subsidy</option>
                    <option value="expense">Outflow (-) Expense / Payment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Classification Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 capitalize"
                  >
                    {CATEGORIES[form.entry_type].map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Transaction Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Milk cooperative weekly payment"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !form.amount}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-fintech-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save Entry
              </button>
            </form>
          </div>
        )}

        {/* Entries List */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-white p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading cashflow entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/50 p-12 text-center">
            <Banknote className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-foreground font-bold text-base">No cash flow activity recorded yet.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Record sales, payments, or subsidy receipts to track daily cash positions.</p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-border bg-white divide-y divide-border overflow-hidden shadow-subtle">
            {entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/50 transition">
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${entry.entry_type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {entry.entry_type === 'income' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground capitalize">{entry.description || entry.category.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.date).toLocaleDateString('en-IN')} • <span className="capitalize">{entry.category.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                </div>
                <span className={`text-base sm:text-lg font-financial font-extrabold ${entry.entry_type === 'income' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {entry.entry_type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

