'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  PiggyBank,
  Receipt,
  CreditCard,
} from 'lucide-react';
import Card, { CardHeader } from '@/components/ui/Card';
import { useTranslation } from '@/stores/languageStore';

interface FinancialHealthCardProps {
  financeData?: {
    expenses?: { count: number; total: number };
    cash_flow?: {
      count: number;
      total_income: number;
      total_expenses: number;
      net: number;
    };
    savings?: {
      goals: number;
      total_saved: number;
      total_target: number;
      progress_percent: number;
    };
    debts?: {
      count: number;
      total_outstanding: number;
      total_principal: number;
      total_monthly_emi: number;
    };
    borrowings?: {
      count: number;
      total_requested: number;
      total_approved: number;
    };
    credit?: {
      records: number;
      latest_score: number | null;
      latest_rating: string | null;
    };
  };
  className?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function FinancialHealthCard({
  financeData,
  className = '',
}: FinancialHealthCardProps) {
  const { t } = useTranslation();
  const fin = financeData || {};
  const cashNet = fin.cash_flow?.net ?? 0;
  const savingsPct = fin.savings?.progress_percent ?? 0;
  const debtTotal = fin.debts?.total_outstanding ?? 0;
  const creditScore = fin.credit?.latest_score ?? null;

  // Compute composite Financial Health Score (0-100) based on real available metrics
  let score = 70; // baseline
  if (cashNet > 0) score += 10;
  else if (cashNet < 0) score -= 15;

  if (savingsPct >= 50) score += 10;
  else if (savingsPct > 0) score += 5;

  if (creditScore) {
    if (creditScore >= 750) score += 10;
    else if (creditScore < 600) score -= 10;
  }

  if (debtTotal > 500000) score -= 5;

  score = Math.max(10, Math.min(100, score));

  const healthRating =
    score >= 80 ? t('dash.robust') || 'Robust' : score >= 60 ? t('dash.stable') || 'Stable' : t('dash.needsAttention') || 'Needs Attention';
  const ratingColor =
    score >= 80
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
      : score >= 60
      ? 'text-primary dark:text-emerald-400 bg-primary/5 dark:bg-primary/20 border-primary/20 dark:border-primary/40'
      : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader
        title={t('dash.financialHealthTitle') || 'Enterprise Financial Health'}
        subtitle={t('dash.financialHealthSubtitle') || 'Consolidated cash flow, savings progress, debt exposure & credit standing'}
        action={
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${ratingColor}`}
          >
            {healthRating} ({score}/100)
          </span>
        }
      />

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
        {/* Cash Flow */}
        <Link
          href="/cashflow"
          className="group rounded-2xl border border-border bg-slate-50/60 dark:bg-[#1C2128] p-4.5 hover:bg-white dark:hover:bg-[#232934] hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-subtle flex flex-col justify-between active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{t('dash.netCashFlow') || 'Net Cash Flow'}</span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
          </div>
          <div className="mt-2.5">
            <p className={`text-xl sm:text-2xl font-black font-financial group-hover:scale-105 origin-left transition-transform duration-200 ${cashNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatINR(cashNet)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {fin.cash_flow?.count || 0} {t('dash.activeEntries') || 'active entries'}
            </p>
          </div>
        </Link>

        {/* Savings */}
        <Link
          href="/savings"
          className="group rounded-2xl border border-border bg-slate-50/60 dark:bg-[#1C2128] p-4.5 hover:bg-white dark:hover:bg-[#232934] hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-subtle flex flex-col justify-between active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{t('dash.savingsGoals') || 'Savings Goals'}</span>
            <PiggyBank className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-200" />
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black font-financial text-foreground group-hover:scale-105 origin-left transition-transform duration-200">
              {formatINR(fin.savings?.total_saved || 0)}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="h-2 flex-1 bg-slate-200 dark:bg-[#2B313C] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                  style={{ width: `${Math.min(100, Math.max(0, savingsPct))}%` }}
                />
              </div>
              <span className="text-xs font-bold text-muted-foreground">{savingsPct}%</span>
            </div>
          </div>
        </Link>

        {/* Debt Exposure */}
        <Link
          href="/debts"
          className="group rounded-2xl border border-border bg-slate-50/60 dark:bg-[#1C2128] p-4.5 hover:bg-white dark:hover:bg-[#232934] hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-subtle flex flex-col justify-between active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{t('dash.outstandingDebt') || 'Outstanding Debt'}</span>
            <Receipt className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-200" />
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black font-financial text-foreground group-hover:scale-105 origin-left transition-transform duration-200">
              {formatINR(debtTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              EMI: {formatINR(fin.debts?.total_monthly_emi || 0)}/mo
            </p>
          </div>
        </Link>

        {/* Credit Standing */}
        <Link
          href="/credit"
          className="group rounded-2xl border border-border bg-slate-50/60 dark:bg-[#1C2128] p-4.5 hover:bg-white dark:hover:bg-[#232934] hover:border-primary/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-subtle flex flex-col justify-between active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{t('dash.creditScore') || 'Credit Score'}</span>
            <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-200" />
          </div>
          <div className="mt-2.5">
            <p className="text-xl sm:text-2xl font-black font-financial text-foreground group-hover:scale-105 origin-left transition-transform duration-200">
              {creditScore ? creditScore : t('dash.unrated') || 'Unrated'}
            </p>
            <p className="text-xs text-muted-foreground capitalize mt-1">
              {fin.credit?.latest_rating ? fin.credit.latest_rating.replace('_', ' ') : t('dash.noRecordsYet') || 'No records yet'}
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Links Strip */}
      <div className="mt-4 pt-3.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span>{t('dash.realtimeSync') || 'Real-time FinCompass ledger sync'}</span>
        </div>
        <div className="flex items-center gap-3 font-semibold">
          <Link href="/expenses" className="text-primary hover:underline hover:scale-105 transition-transform duration-150">
            {t('nav.expenses') || 'Expenses'}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <Link href="/cashflow" className="text-primary hover:underline hover:scale-105 transition-transform duration-150">
            {t('nav.cashflow') || 'Cash Flow'}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <Link href="/borrowing" className="text-primary hover:underline hover:scale-105 transition-transform duration-150">
            {t('nav.borrowing') || 'Borrowing'}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <Link href="/budget" className="text-primary hover:underline hover:scale-105 transition-transform duration-150">
            {t('nav.budget') || 'Budget'}
          </Link>
        </div>
      </div>
    </Card>
  );
}
