'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/ui/AppShell';
import { getDebts, createDebt, addDebtPayment } from '@/lib/api';
import { CreditCard, Plus, Loader2, X, Landmark } from 'lucide-react';
import Card from '@/components/ui/Card';
import MetricDisplay from '@/components/ui/MetricDisplay';
import { useTranslation } from '@/stores/languageStore';
import DebtRepaymentChart from '@/components/charts/DebtRepaymentChart';

export default function DebtsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [payDebt, setPayDebt] = useState<string | null>(null);
  const [form, setForm] = useState({ lender_name: '', loan_type: 'term_loan', principal_amount: '', outstanding_amount: '', interest_rate: '', emi_amount: '', tenure_months: '', notes: '' });
  const [payForm, setPayForm] = useState({ amount: '', principal_portion: '', interest_portion: '', payment_mode: 'neft', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('udyam_profile_id') || '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000001';

  async function loadData() {
    try {
      setLoading(true);
      setData(await getDebts(profileId));
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
    if (!form.lender_name || !form.principal_amount) return;
    setSubmitting(true);
    try {
      await createDebt(profileId, {
        ...form,
        principal_amount: parseFloat(form.principal_amount),
        outstanding_amount: parseFloat(form.outstanding_amount || form.principal_amount),
        interest_rate: parseFloat(form.interest_rate) || 10,
        emi_amount: form.emi_amount ? parseFloat(form.emi_amount) : undefined,
        tenure_months: form.tenure_months ? parseInt(form.tenure_months) : undefined,
      });
      setForm({ lender_name: '', loan_type: 'term_loan', principal_amount: '', outstanding_amount: '', interest_rate: '', emi_amount: '', tenure_months: '', notes: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payDebt || !payForm.amount) return;
    setSubmitting(true);
    try {
      await addDebtPayment(payDebt, {
        amount: parseFloat(payForm.amount),
        principal_portion: parseFloat(payForm.principal_portion) || parseFloat(payForm.amount),
        interest_portion: parseFloat(payForm.interest_portion) || 0,
        payment_mode: payForm.payment_mode,
        notes: payForm.notes || undefined,
      });
      setPayForm({ amount: '', principal_portion: '', interest_portion: '', payment_mode: 'neft', notes: '' });
      setPayDebt(null);
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

  const statusColors: Record<string, string> = {
    active: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    paid_off: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    defaulted: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
    restructured: 'bg-primary/10 text-primary border-primary/20',
  };

  return (
    <AppShell>
      <main className="flex-1 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex flex-col gap-8">
        {/* Banner */}
        <div className="rounded-[28px] bg-gradient-to-br from-primary via-primary-600 to-[#0C4E36] text-white p-7 sm:p-10 shadow-fintech-card relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white/90 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <Landmark className="h-3.5 w-3.5 text-mint" /> {t('debts.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('debts.title')}</h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed font-normal">
              {t('debts.desc')}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Total Outstanding"
              value={data ? fmt(data.total_outstanding) : '—'}
              scoreVariant="risk"
              size="md"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Total Principal"
              value={data ? fmt(data.total_principal) : '—'}
              size="md"
            />
          </Card>
          <Card padding="md" className="border-border bg-white dark:bg-[#161B22] rounded-2xl shadow-subtle">
            <MetricDisplay
              label="Active Loans Count"
              value={data?.active_count ?? 0}
              scoreVariant="warning"
              size="md"
            />
          </Card>
        </div>

        {/* Debt Repayment Portfolio Chart */}
        {data?.debts && data.debts.length > 0 && (
          <DebtRepaymentChart
            debts={data.debts.map((d: any) => ({
              name: d.lender_name || d.loan_type || 'Loan Facility',
              totalAmount: Number(d.principal_amount) || 0,
              remainingAmount: Number(d.outstanding_amount ?? d.principal_amount) || 0,
              interestRate: d.interest_rate,
            }))}
          />
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-xs sm:text-sm font-semibold shadow-fintech-btn hover:bg-primary-600 transition"
          >
            <Plus className="h-4 w-4" /> Add Debt Record
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="rounded-[24px] border border-primary/20 bg-slate-50/70 p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-foreground">Add Debt / Loan Record</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Lender Name</label>
                  <input
                    type="text"
                    value={form.lender_name}
                    onChange={(e) => setForm({ ...form, lender_name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. State Bank of India, Local Cooperative"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Loan Type</label>
                  <select
                    value={form.loan_type}
                    onChange={(e) => setForm({ ...form, loan_type: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="term_loan">Term Loan</option>
                    <option value="working_capital">Working Capital</option>
                    <option value="credit_card">Business Credit Card</option>
                    <option value="personal">Personal / SHG Loan</option>
                    <option value="government_scheme">Government Scheme Loan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Principal Amount (₹)</label>
                  <input
                    type="number"
                    value={form.principal_amount}
                    onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="e.g. 100000"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Outstanding Amount (₹)</label>
                  <input
                    type="number"
                    value={form.outstanding_amount}
                    onChange={(e) => setForm({ ...form, outstanding_amount: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="Same as principal if new"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.interest_rate}
                    onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={form.emi_amount}
                    onChange={(e) => setForm({ ...form, emi_amount: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    placeholder="e.g. 4500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 shadow-fintech-btn"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Debt Record'}
              </button>
            </form>
          </div>
        )}

        {/* Record Payment Form */}
        {payDebt && (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50/30 p-6 sm:p-8 shadow-subtle">
            <form onSubmit={handlePay} className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <h3 className="text-base font-bold text-foreground">Record EMI / Debt Payment</h3>
                <button type="button" onClick={() => setPayDebt(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Principal Portion (₹)</label>
                  <input
                    type="number"
                    value={payForm.principal_portion}
                    onChange={(e) => setPayForm({ ...payForm, principal_portion: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-financial"
                    placeholder="Amount reducing principal"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Payment Mode</label>
                  <select
                    value={payForm.payment_mode}
                    onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
                    className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                  >
                    <option value="neft">NEFT / NetBanking</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="cash">Cash Receipt</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="self-end px-7 py-3 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition disabled:opacity-50 shadow-fintech-btn"
              >
                Confirm Payment
              </button>
            </form>
          </div>
        )}

        {/* Debt Cards Listing */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-white p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading debt schedules...</p>
          </div>
        ) : !data?.debts?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/50 p-12 text-center">
            <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-foreground font-bold text-base">No debts recorded yet.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Keep track of your active loans and EMI repayments here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.debts.map((d: any) => (
              <div key={d.id} className="rounded-[24px] border border-border bg-white p-6 shadow-subtle hover:border-primary/30 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-foreground">{d.lender_name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusColors[d.status] || 'bg-slate-100 text-muted-foreground border-slate-200'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      <span className="capitalize font-semibold text-primary">{d.loan_type.replace(/_/g, ' ')}</span> {d.scheme_name ? `• ${d.scheme_name}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setPayDebt(d.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full text-xs font-semibold transition-colors"
                  >
                    Pay EMI
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Principal</p>
                    <p className="font-financial font-bold text-foreground text-base mt-0.5">{fmt(d.principal_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding</p>
                    <p className="font-financial font-extrabold text-rose-600 text-base mt-0.5">{fmt(d.outstanding_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rate</p>
                    <p className="font-financial font-bold text-foreground text-base mt-0.5">{d.interest_rate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">EMI</p>
                    <p className="font-financial font-extrabold text-foreground text-base mt-0.5">{d.emi_amount ? fmt(d.emi_amount) : '—'}</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, d.paid_percent)}%` }}
                  />
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-2">{d.paid_percent}% Principal Cleared</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}

