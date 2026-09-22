'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { useLanguageStore } from '@/stores/languageStore';
import { getExpenses, createExpense, deleteExpense, getExpenseSummary } from '@/lib/api';
import {
  Plus, Trash2, Receipt, RefreshCw, Filter,
  Loader2, X,
  Home, Zap, Package, Users, Megaphone, Truck, Factory, ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';

export interface ExpenseCategoryConfig {
  value: string;
  label: string;
  icon: LucideIcon;
}

const EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  { value: 'rent', label: 'Rent & Lease', icon: Home },
  { value: 'utilities', label: 'Electricity & Water', icon: Zap },
  { value: 'inventory', label: 'Seeds, Feed & Stock', icon: Package },
  { value: 'salaries', label: 'Wages & Labor', icon: Users },
  { value: 'marketing', label: 'Marketing & Mandi Fees', icon: Megaphone },
  { value: 'transport', label: 'Transport & Freight', icon: Truck },
  { value: 'raw_materials', label: 'Raw Materials & Inputs', icon: Factory },
  { value: 'other', label: 'Other Operational Expenses', icon: ClipboardList },
];

import { useTranslation } from '@/stores/languageStore';
import ExpenseCategoryChart from '@/components/charts/ExpenseCategoryChart';

export default function ExpensesPage() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('all');
  const [form, setForm] = useState({ category: 'rent', description: '', amount: '', is_recurring: false, recurring_frequency: 'monthly', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  async function loadData() {
    try {
      setLoading(true);
      const [exp, sum] = await Promise.all([
        getExpenses(profileId, filterCat === 'all' ? undefined : filterCat),
        getExpenseSummary(profileId),
      ]);
      setExpenses(Array.isArray(exp) ? exp : []);
      setSummary(sum);
    } catch (err) {
      console.warn('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filterCat]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    try {
      await createExpense(profileId, {
        category: form.category,
        description: form.description || undefined,
        amount: parseFloat(form.amount),
        is_recurring: form.is_recurring,
        recurring_frequency: form.is_recurring ? form.recurring_frequency : undefined,
        notes: form.notes || undefined,
      });
      setForm({ category: 'rent', description: '', amount: '', is_recurring: false, recurring_frequency: 'monthly', notes: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error('Failed to add expense:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id, profileId);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] text-white p-7 sm:p-10 shadow-fintech-card relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white/90 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <Receipt className="h-3.5 w-3.5 text-mint" /> {t('expenses.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('expenses.title')}</h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed font-normal">
              {t('expenses.desc')}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Total Expenses"
              value={summary ? formatCurrency(summary.total_expenses) : '—'}
              scoreVariant="risk"
              size="sm"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Recurring Total"
              value={summary ? formatCurrency(summary.recurring_total) : '—'}
              scoreVariant="warning"
              size="sm"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Recorded Entries"
              value={summary?.count ?? 0}
              size="sm"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Categories Tracked"
              value={summary?.by_category ? Object.keys(summary.by_category).length : 0}
              scoreVariant="verified"
              size="sm"
            />
          </Card>
        </div>

        {/* Expense Category Analytics Chart */}
        {summary && summary.by_category && Object.keys(summary.by_category).length > 0 && (
          <ExpenseCategoryChart
            categories={Object.entries(summary.by_category).map(([category, amount]) => ({
              category,
              amount: Number(amount) || 0,
              count: expenses.filter((e) => e.category === category).length,
            }))}
          />
        )}

        {/* Filter & Add Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="rounded-full border border-border bg-white px-4 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="">All Expense Categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-xs sm:text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition"
          >
            <Plus className="h-4 w-4" /> Add Expense Entry
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="rounded-[24px] border border-primary/20 bg-slate-50/70 p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-foreground">Record Business Outflow</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="0"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. 5 bags of fertilizer / tractor diesel"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                    id="recurring"
                  />
                  <label htmlFor="recurring" className="text-xs sm:text-sm font-semibold text-foreground">Recurring periodic expense</label>
                </div>
                {form.is_recurring && (
                  <select
                    value={form.recurring_frequency}
                    onChange={(e) => setForm({ ...form, recurring_frequency: e.target.value })}
                    className="rounded-xl border border-border bg-white px-4 py-2 text-sm outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly / Seasonal</option>
                  </select>
                )}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Optional vendor/receipt note"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !form.amount}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 inline-flex items-center gap-2 shadow-fintech-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Record Outflow
              </button>
            </form>
          </div>
        )}

        {/* Expense List */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-white p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading expense records...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/50 p-12 text-center">
            <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-foreground font-bold text-base">No expense entries recorded.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Record purchases, raw materials, rent, and utility bills here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map((exp) => {
              const catInfo = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
              const CatIcon = catInfo?.icon || ClipboardList;
              return (
                <div key={exp.id} className="rounded-2xl border border-border bg-white p-4 sm:p-5 hover:border-primary/30 hover:shadow-subtle transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-foreground text-sm sm:text-base">{exp.description || catInfo?.label || exp.category}</h4>
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                          {catInfo?.label || exp.category}
                        </span>
                        {exp.is_recurring && <RefreshCw className="h-3.5 w-3.5 text-amber-600" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(exp.date).toLocaleDateString('en-IN')} {exp.recurring_frequency ? `• ${exp.recurring_frequency}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="text-base sm:text-lg font-financial font-extrabold text-rose-600">
                      -{formatCurrency(exp.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

