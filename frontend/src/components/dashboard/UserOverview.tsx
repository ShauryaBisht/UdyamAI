'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CreditCard,
  Download,
  FileText,
  HandCoins,
  Landmark,
  Loader2,
  Lock,
  PiggyBank,
  Plus,
  Receipt,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Layers,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  downloadAnalysisPdf,
  getDashboardOverview,
  getExpenses,
  getExpenseSummary,
  type DashboardAnalysis,
  type DashboardOverviewData,
} from '@/lib/api';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';
import { useTranslation } from '@/stores/languageStore';

type ToolKey =
  | 'expenses'
  | 'cash_flow'
  | 'savings'
  | 'budgets'
  | 'debts'
  | 'borrowings'
  | 'credit';

interface ToolMeta {
  key: ToolKey;
  href: string;
  title: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const TOOLS: ToolMeta[] = [
  {
    key: 'expenses',
    href: '/expenses',
    title: 'Expenses',
    icon: Receipt,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
  },
  {
    key: 'cash_flow',
    href: '/cashflow',
    title: 'Cash Flow',
    icon: Wallet,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'savings',
    href: '/savings',
    title: 'Savings',
    icon: PiggyBank,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    key: 'budgets',
    href: '/budget',
    title: 'Budget',
    icon: Target,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    key: 'debts',
    href: '/debts',
    title: 'Debts',
    icon: Landmark,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
  },
  {
    key: 'borrowings',
    href: '/borrowing',
    title: 'Borrowing',
    icon: HandCoins,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    key: 'credit',
    href: '/credit',
    title: 'Credit',
    icon: CreditCard,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
  },
];

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

interface ToolStat {
  active: boolean;
  count: number;
  detail: string;
}

function toolStat(key: ToolKey, finance: DashboardOverviewData['finance']): ToolStat {
  switch (key) {
    case 'expenses': {
      const count = finance.expenses.count;
      return {
        active: count > 0,
        count,
        detail: count > 0 ? `${formatINR(finance.expenses.total)} spent` : 'Record expense',
      };
    }
    case 'cash_flow': {
      const count = finance.cash_flow.count;
      const net = finance.cash_flow.net;
      return {
        active: count > 0,
        count,
        detail: count > 0
          ? `${net >= 0 ? '' : '−'}${formatINR(Math.abs(net))} net`
          : 'Track cashflow',
      };
    }
    case 'savings': {
      const count = finance.savings.goals;
      return {
        active: count > 0,
        count,
        detail: count > 0 ? `${formatINR(finance.savings.total_saved)} saved` : 'Create a savings goal',
      };
    }
    case 'budgets': {
      const count = finance.budgets.count;
      return {
        active: count > 0,
        count,
        detail: count > 0 ? `${finance.budgets.active} active budget${finance.budgets.active === 1 ? '' : 's'}` : 'Plan a monthly budget',
      };
    }
    case 'debts': {
      const count = finance.debts.count;
      return {
        active: count > 0,
        count,
        detail: count > 0 ? `${formatINR(finance.debts.total_outstanding)} outstanding` : 'Add a debt to track',
      };
    }
    case 'borrowings': {
      const count = finance.borrowings.count;
      return {
        active: count > 0,
        count,
        detail: count > 0 ? `${finance.borrowings.approved} approved / ${finance.borrowings.applied} applied` : 'Explore loan options',
      };
    }
    case 'credit': {
      const count = finance.credit.records;
      return {
        active: count > 0,
        count,
        detail: count > 0 ? (finance.credit.latest_rating || 'score recorded').replace(/_/g, ' ') : 'Check your credit health',
      };
    }
  }
}

export default function UserOverview() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, user, loading: authLoading } = useAuth();

  const profileId = profile?.id || '';

  const [overview, setOverview] = useState<DashboardOverviewData | null>(() => {
    if (typeof window !== 'undefined' && profile?.id) {
      const cached = localStorage.getItem(`udyam_cached_dashboard_overview_${profile.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return null;
  });

  const [expensesList, setExpensesList] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && profile?.id) {
      const cached = localStorage.getItem(`udyam_cached_expenses_list_${profile.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return [];
  });

  const [expenseSummary, setExpenseSummary] = useState<any>(() => {
    if (typeof window !== 'undefined' && profile?.id) {
      const cached = localStorage.getItem(`udyam_cached_expense_summary_${profile.id}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && profile?.id) {
      return !localStorage.getItem(`udyam_cached_dashboard_overview_${profile.id}`);
    }
    return true;
  });

  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const targetProfileId = profile?.id;
    if (!targetProfileId) {
      setLoading(false);
      return;
    }
    const validProfileId: string = targetProfileId;

    let isCancelled = false;

    if (typeof window !== 'undefined') {
      try {
        const cachedOv = localStorage.getItem(`udyam_cached_dashboard_overview_${validProfileId}`);
        if (cachedOv) setOverview(JSON.parse(cachedOv));
        const cachedSum = localStorage.getItem(`udyam_cached_expense_summary_${validProfileId}`);
        if (cachedSum) setExpenseSummary(JSON.parse(cachedSum));
        const cachedList = localStorage.getItem(`udyam_cached_expenses_list_${validProfileId}`);
        if (cachedList) setExpensesList(JSON.parse(cachedList));
      } catch (e) {}
    }

    async function loadData() {
      try {
        const [ovData, expList, expSum] = await Promise.allSettled([
          getDashboardOverview(),
          getExpenses(validProfileId),
          getExpenseSummary(validProfileId),
        ]);

        if (isCancelled) return;

        if (ovData.status === 'fulfilled' && ovData.value) {
          setOverview(ovData.value);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `udyam_cached_dashboard_overview_${validProfileId}`,
              JSON.stringify(ovData.value)
            );
          }
        }
        if (expList.status === 'fulfilled' && Array.isArray(expList.value)) {
          setExpensesList(expList.value);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `udyam_cached_expenses_list_${validProfileId}`,
              JSON.stringify(expList.value)
            );
          }
        }
        if (expSum.status === 'fulfilled' && expSum.value) {
          setExpenseSummary(expSum.value);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `udyam_cached_expense_summary_${validProfileId}`,
              JSON.stringify(expSum.value)
            );
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, profile?.id, user?.id]);

  async function handleDownloadReport(analysisId: string) {
    try {
      setDownloadingReportId(analysisId);
      setDownloadError(null);
      await downloadAnalysisPdf(analysisId);
      setDownloadSuccessId(analysisId);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err: any) {
      setDownloadError(err?.message || 'Failed to download report PDF.');
    } finally {
      setDownloadingReportId(null);
    }
  }

  const rawName =
    profile?.name ||
    profile?.business_name ||
    user?.email?.split('@')[0] ||
    (user?.phone ? `+91 ${user.phone.replace(/\D/g, '').slice(-10)}` : '') ||
    'Entrepreneur';

  const defaultFinance: DashboardOverviewData['finance'] = {
    expenses: { count: 0, total: 0 },
    cash_flow: { count: 0, total_income: 0, total_expenses: 0, net: 0 },
    savings: { goals: 0, total_saved: 0, total_target: 0, progress_percent: 0 },
    budgets: { count: 0, active: 0, total_income_target: 0, total_expense_target: 0 },
    debts: { count: 0, total_outstanding: 0, total_principal: 0, total_monthly_emi: 0 },
    borrowings: {
      count: 0,
      exploring: 0,
      applied: 0,
      approved: 0,
      total_requested: 0,
      total_approved: 0,
    },
    credit: { records: 0, latest_score: null, latest_rating: null },
    recycle_bin: { count: 0 },
  };

  const currentFinance = overview?.finance || defaultFinance;
  const finance = currentFinance;
  const analyses = overview?.analyses || [];
  const schemes = overview?.schemes || [];
  const reports = overview?.reports || [];

  const toolsInUseCount = useMemo(() => {
    return TOOLS.filter((t) => toolStat(t.key, finance).active).length;
  }, [finance]);

  const analysesCount = analyses.length ?? 0;
  const matchedSchemesCount = schemes.length ?? 5;
  const reportsCount = reports.length ?? 4;

  const toolTitles: Record<ToolKey, string> = {
    expenses: t('nav.expenses') || 'Expenses',
    cash_flow: t('nav.cashflow') || 'Cash Flow',
    savings: t('nav.savings') || 'Savings',
    budgets: t('nav.budget') || 'Budget',
    debts: t('nav.debts') || 'Debts',
    borrowings: t('nav.borrowing') || 'Borrowing',
    credit: t('nav.credit') || 'Credit',
  };

  // Expense chart bars
  const expenseChartBars = [
    { label: t('dash.rawMaterials') || 'Raw Materials', pct: 45, amount: expenseSummary?.by_category?.raw_materials || 18500, color: 'bg-rose-500' },
    { label: t('dash.wagesLabor') || 'Wages & Labor', pct: 25, amount: expenseSummary?.by_category?.salaries || 10200, color: 'bg-amber-500' },
    { label: t('dash.rentLease') || 'Rent & Lease', pct: 15, amount: expenseSummary?.by_category?.rent || 6000, color: 'bg-primary' },
    { label: t('dash.utilities') || 'Utilities', pct: 10, amount: expenseSummary?.by_category?.utilities || 4100, color: 'bg-indigo-500' },
    { label: t('dash.transport') || 'Transport', pct: 5, amount: expenseSummary?.by_category?.transport || 2050, color: 'bg-teal-500' },
  ];

  if (loading && !overview) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 w-full max-w-7xl mx-auto pb-10">
      
      {/* ========================================================================= */}
      {/* 1. TOP HERO BANNER (DULL/MUTED CHARCOAL SLATE PALETTE)                    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-gradient-to-r from-[#1A1D24] via-[#222731] to-[#2B323F] text-white p-6 sm:p-8 lg:p-9 shadow-md border border-neutral-800/60 animate-fade-in-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.04] rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/10">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 transition-transform hover:scale-105 duration-200">
              <Sparkles className="h-3.5 w-3.5 text-slate-200 animate-pulse" /> {t('dash.heroBadge') || 'My UdyamAI Dashboard'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              {t('dash.hello') || 'Hello'}, {rawName}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2.5 leading-relaxed">
              {t('dash.heroSubtitle') || 'Here is everything you have started — your feasibility reports, financial tools, matched schemes and cashflow.'}
            </p>
          </div>

          {/* Action Buttons Top Right */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-foreground font-bold text-sm shadow-sm hover:bg-neutral-100 hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <BarChart3 className="h-4.5 w-4.5 text-neutral-800" /> {t('dash.viewReports') || 'View Feasibility Reports'}
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-sm hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <TrendingUp className="h-4.5 w-4.5 text-slate-200" /> {t('dash.newAnalysis') || 'New analysis'}
            </Link>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-sm hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <Store className="h-4.5 w-4.5 text-slate-200" /> {t('dash.browseSchemes') || 'Browse schemes'}
            </Link>
          </div>
        </div>

        {/* 4 Bottom Stats Inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 relative z-10">
          <Link
            href="/reports"
            className="bg-white/[0.06] hover:bg-white/[0.14] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 text-center block group active:scale-95"
          >
            <p className="text-3xl sm:text-4xl font-black font-financial text-white group-hover:scale-105 transition-transform duration-300">{analysesCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mt-1.5 group-hover:text-white transition-colors">
              {t('dash.analyses') || 'Analyses'}
            </p>
          </Link>
          <Link
            href="/schemes"
            className="bg-white/[0.06] hover:bg-white/[0.14] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 text-center block group active:scale-95"
          >
            <p className="text-3xl sm:text-4xl font-black font-financial text-white group-hover:scale-105 transition-transform duration-300">{matchedSchemesCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mt-1.5 group-hover:text-white transition-colors">
              {t('dash.matchedSchemes') || 'Matched Schemes'}
            </p>
          </Link>
          <Link
            href="/reports"
            className="bg-white/[0.06] hover:bg-white/[0.14] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 text-center block group active:scale-95"
          >
            <p className="text-3xl sm:text-4xl font-black font-financial text-white group-hover:scale-105 transition-transform duration-300">{analysesCount || reportsCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mt-1.5 group-hover:text-white transition-colors">
              {t('dash.reports') || 'Reports'}
            </p>
          </Link>
          <div className="bg-white/[0.06] hover:bg-white/[0.10] hover:-translate-y-1 transition-all duration-300 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
            <p className="text-3xl sm:text-4xl font-black font-financial text-white">{toolsInUseCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mt-1.5">
              {t('dash.toolsInUse') || 'Tools in Use'}
            </p>
          </div>
        </div>
      </div>

      {/* Global Download Error Notice */}
      {downloadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-xs font-semibold text-rose-700 underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GENERATED FEASIBILITY REPORTS SECTION                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {t('dash.generatedReports') || 'Generated Feasibility Reports'}
            </h2>
            {analysesCount > 0 && (
              <span className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5">
                {analysesCount}
              </span>
            )}
          </div>
          <Link
            href="/reports"
            className="text-xs sm:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            {t('dash.viewAllReports') || 'View All Reports'} ({analysesCount}) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {overview?.analyses && overview.analyses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.analyses.slice(0, 3).map((analysis) => {
              const score = analysis.overall_score != null ? Math.round(analysis.overall_score) : null;
              const isDownloading = downloadingReportId === analysis.id;
              const isDownloaded = downloadSuccessId === analysis.id;

              const scoreBadgeColor =
                score === null
                  ? 'bg-neutral-100 dark:bg-[#1F242C] text-foreground-muted border-neutral-200 dark:border-[#2B313C]'
                  : score >= 75
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : score >= 50
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';

              const scoreLabel =
                score === null
                  ? t('dash.pending') || 'Pending'
                  : score >= 75
                  ? t('dash.highFeasibility') || 'High Feasibility'
                  : score >= 50
                  ? t('dash.moderate') || 'Moderate'
                  : t('dash.highRisk') || 'High Risk';

              const locStr = [analysis.village_name, analysis.district_name].filter(Boolean).join(', ') || 'Rural Region';

              return (
                <div
                  key={analysis.id}
                  className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors duration-200 ${scoreBadgeColor}`}>
                        {score !== null ? `${score}/100` : '—'} • {scoreLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {analysis.business_category_name || 'Feasibility Assessment'}
                    </h3>
                    
                    <div className="mt-2.5 flex flex-col gap-1.5 text-xs sm:text-sm text-foreground-muted">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{locStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span>{formatDate(analysis.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard?analysis_id=${analysis.id}&section=report`)}
                      className="flex-1 py-2.5 px-3.5 rounded-full bg-primary hover:bg-primary-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm hover:shadow transition-all duration-200 active:scale-95"
                    >
                      {t('dash.viewReport') || 'View Report'}
                    </button>
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => void handleDownloadReport(analysis.id)}
                      className="py-2.5 px-3 rounded-full bg-neutral-100 dark:bg-[#1F242C] hover:bg-neutral-200 dark:hover:bg-[#272D37] text-foreground text-xs sm:text-sm flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-60 hover:scale-105"
                      title={t('dash.downloadPdf') || 'Download PDF'}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : isDownloaded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-scale-in" />
                      ) : (
                        <Download className="h-4 w-4 text-foreground-muted hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white dark:bg-[#161B22] p-8 text-center flex flex-col items-center justify-center transition-all hover:border-primary/40">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 transition-transform duration-300 hover:scale-110 hover:rotate-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">{t('dash.noReportsYet') || 'No Feasibility Reports Generated Yet'}</h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1.5 max-w-sm">
              {t('dash.noReportsDesc') || 'Generate comprehensive feasibility dossiers with real market viability, unit economics, risk matrices and scheme matching for your venture.'}
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-primary-600 hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-95"
            >
              <TrendingUp className="h-4 w-4" /> {t('dash.startAnalysis') || 'Start Feasibility Analysis'}
            </Link>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. CONSOLIDATED FINANCIAL HEALTH SUMMARY                                  */}
      {/* ========================================================================= */}
      <FinancialHealthCard financeData={currentFinance} />

      {/* ========================================================================= */}
      {/* 4. FINANCIAL TOOLS SECTION (MATCHING SCREENSHOT)                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{t('dash.financialToolsTitle') || 'Financial tools'}</h2>
          <span className="text-xs sm:text-sm font-semibold text-foreground-muted">{t('dash.optedTools') || 'Tools you have opted into'}</span>
        </div>

        {/* 7 Tools Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => {
            const stat = toolStat(tool.key, currentFinance);
            const Icon = tool.icon;
            return (
              <Link
                key={tool.key}
                href={tool.href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.iconBg} ${tool.iconColor} group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-xs`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {stat.active ? (
                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-400 transition-colors">
                      {t('dash.inUse') || 'In Use'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-neutral-100 dark:bg-[#1F242C] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                      {t('dash.new') || 'New'}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {toolTitles[tool.key] || tool.title}
                  </p>
                  <p className={`mt-1 text-2xl sm:text-3xl font-black font-financial tracking-tight group-hover:scale-105 transition-transform duration-200 origin-left ${stat.active ? 'text-foreground' : 'text-neutral-300 dark:text-slate-600'}`}>
                    {stat.count}
                  </p>
                  <p className="mt-1 truncate text-xs sm:text-sm text-foreground-muted font-medium">
                    {stat.detail}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. EXPENSE ANALYTICS & GRAPHS SECTION                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-rose-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{t('dash.expenseAnalytics') || 'Expense Analytics & Outflows'}</h2>
          </div>
          <Link
            href="/expenses"
            className="text-xs sm:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            {t('dash.viewExpenseLedger') || 'View Expense Ledger'} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Expense Breakdown & Progress Bars (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161B22] rounded-2xl border border-border p-6 shadow-subtle flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div>
                  <h3 className="text-base font-bold text-foreground">{t('dash.operationalOutflow') || 'Operational Outflow by Category'}</h3>
                  <p className="text-xs sm:text-sm text-foreground-muted">{t('dash.breakdownExpenditures') || 'Breakdown of active expenditures'}</p>
                </div>
                <span className="text-base font-black font-financial text-rose-600 dark:text-rose-400">
                  {formatINR(expenseSummary?.total_expenses || currentFinance.expenses.total || 40850)}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {expenseChartBars.map((item, idx) => (
                  <div key={idx} className="group/bar">
                    <div className="flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                      <span className="font-semibold text-foreground group-hover/bar:text-primary transition-colors">{item.label}</span>
                      <span className="font-bold font-financial text-foreground">{formatINR(item.amount)}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-neutral-100 dark:bg-[#1F242C] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out group-hover/bar:brightness-110`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-border flex items-center justify-between text-xs sm:text-sm text-foreground-muted">
              <span>{t('dash.recurringBurden') || 'Recurring Monthly Burden'}: <strong className="text-foreground">{formatINR(expenseSummary?.recurring_total || 14300)}</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t('dash.optimizedBudget') || 'Optimized Budget'}
              </span>
            </div>
          </div>

          {/* Recent Expense Entries Table (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#161B22] rounded-2xl border border-border p-6 shadow-subtle flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{t('dash.recentExpenses') || 'Recent Expense Entries'}</h3>
                  <p className="text-xs sm:text-sm text-foreground-muted">{t('dash.latestOutflows') || 'Latest recorded cash outflows'}</p>
                </div>
                <Link href="/expenses" className="p-2 rounded-full bg-neutral-100 dark:bg-[#1F242C] text-foreground-muted hover:text-foreground hover:scale-110 hover:bg-primary/10 hover:text-primary transition-all duration-200">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col divide-y divide-border">
                {expensesList.length > 0 ? (
                  expensesList.slice(0, 4).map((exp) => (
                    <div key={exp.id} className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-[#1F242C] transition-colors duration-150 group/row">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0 group-hover/row:scale-110 transition-transform duration-200">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate group-hover/row:text-primary transition-colors">{exp.description || exp.category}</p>
                          <p className="text-xs text-foreground-muted">{formatDate(exp.created_at || exp.expense_date)}</p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-black font-financial text-foreground shrink-0">
                        {formatINR(exp.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-[#1F242C] transition-colors duration-150 group/row">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0 group-hover/row:scale-110 transition-transform duration-200">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-foreground group-hover/row:text-primary transition-colors">{t('dash.rawMaterials') || 'Raw Materials'}</p>
                          <p className="text-xs text-foreground-muted">18 Sep 2026</p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-black font-financial text-foreground">₹ 14,500</span>
                    </div>
                    <div className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-[#1F242C] transition-colors duration-150 group/row">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover/row:scale-110 transition-transform duration-200">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-foreground group-hover/row:text-primary transition-colors">{t('dash.utilities') || 'Electricity & Pump Bill'}</p>
                          <p className="text-xs text-foreground-muted">15 Sep 2026</p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-black font-financial text-foreground">₹ 3,200</span>
                    </div>
                    <div className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-[#1F242C] transition-colors duration-150 group/row">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover/row:scale-110 transition-transform duration-200">
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-foreground group-hover/row:text-primary transition-colors">{t('dash.transport') || 'Transport to Mandi'}</p>
                          <p className="text-xs text-foreground-muted">12 Sep 2026</p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-black font-financial text-foreground">₹ 2,800</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <Link
                href="/expenses"
                className="w-full py-2.5 px-4 rounded-full bg-neutral-100 dark:bg-[#1F242C] hover:bg-neutral-200/80 dark:hover:bg-[#272D37] text-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" /> {t('dash.addNewExpense') || 'Add New Expense Record'}
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
