'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
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
  Receipt,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  downloadAnalysisPdf,
  getDashboardOverview,
  type DashboardAnalysis,
  type DashboardOverviewData,
  type DashboardScheme,
} from '@/lib/api';

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
  accent: string; // tailwind classes for the icon tile
}

const TOOLS: ToolMeta[] = [
  { key: 'expenses', href: '/expenses', title: 'Expenses', icon: Receipt, accent: 'bg-danger/10 text-status-risk' },
  { key: 'cash_flow', href: '/cashflow', title: 'Cash Flow', icon: Wallet, accent: 'bg-primary/10 text-primary' },
  { key: 'savings', href: '/savings', title: 'Savings', icon: PiggyBank, accent: 'bg-primary/10 text-primary' },
  { key: 'budgets', href: '/budget', title: 'Budget', icon: Target, accent: 'bg-accent/15 text-status-warning' },
  { key: 'debts', href: '/debts', title: 'Debts', icon: Landmark, accent: 'bg-danger/10 text-status-risk' },
  { key: 'borrowings', href: '/borrowing', title: 'Borrowing', icon: HandCoins, accent: 'bg-accent/15 text-status-warning' },
  { key: 'credit', href: '/credit', title: 'Credit', icon: CreditCard, accent: 'bg-primary/10 text-primary' },
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

function statusChip(status: string) {
  const styles: Record<string, string> = {
    completed: 'bg-primary/10 text-status-verified',
    running: 'bg-accent/15 text-status-warning',
    pending: 'bg-foreground/5 text-foreground/60',
    failed: 'bg-danger/10 text-status-risk',
  };

  return styles[status] || 'bg-foreground/5 text-foreground/60';
}

function scoreColor(score: number | null | undefined) {
  if (score == null) return 'text-foreground/40';
  if (score >= 75) return 'text-status-verified';
  if (score >= 50) return 'text-status-warning';
  return 'text-status-risk';
}

interface ToolStat {
  active: boolean;
  headline: string;
  detail: string;
}

function toolStat(key: ToolKey, finance: DashboardOverviewData['finance']): ToolStat {
  switch (key) {
    case 'expenses': {
      const active = finance.expenses.count > 0;
      return {
        active,
        headline: active ? String(finance.expenses.count) : '0',
        detail: active ? `${formatINR(finance.expenses.total)} spent` : 'Record your first expense',
      };
    }
    case 'cash_flow': {
      const active = finance.cash_flow.count > 0;
      const net = finance.cash_flow.net;
      return {
        active,
        headline: active ? String(finance.cash_flow.count) : '0',
        detail: active
          ? `${net >= 0 ? '+' : '−'}${formatINR(Math.abs(net))} net`
          : 'Track income & expenses',
      };
    }
    case 'savings': {
      const active = finance.savings.goals > 0;
      return {
        active,
        headline: active ? String(finance.savings.goals) : '0',
        detail: active
          ? `${formatINR(finance.savings.total_saved)} saved`
          : 'Create a savings goal',
      };
    }
    case 'budgets': {
      const active = finance.budgets.count > 0;
      return {
        active,
        headline: active ? String(finance.budgets.count) : '0',
        detail: active
          ? `${finance.budgets.active} active budget${finance.budgets.active === 1 ? '' : 's'}`
          : 'Plan a monthly budget',
      };
    }
    case 'debts': {
      const active = finance.debts.count > 0;
      return {
        active,
        headline: active ? String(finance.debts.count) : '0',
        detail: active
          ? `${formatINR(finance.debts.total_outstanding)} outstanding`
          : 'Add a debt to track',
      };
    }
    case 'borrowings': {
      const active = finance.borrowings.count > 0;
      return {
        active,
        headline: active ? String(finance.borrowings.count) : '0',
        detail: active
          ? `${finance.borrowings.approved} approved of ${finance.borrowings.applied} applied`
          : 'Explore loan options',
      };
    }
    case 'credit': {
      const active = finance.credit.records > 0;
      return {
        active,
        headline: active && finance.credit.latest_score != null ? String(finance.credit.latest_score) : '0',
        detail: active
          ? (finance.credit.latest_rating || 'score recorded').replace(/_/g, ' ')
          : 'Check your credit health',
      };
    }
  }
}

function ToolCard({ meta, finance }: { meta: ToolMeta; finance: DashboardOverviewData['finance'] }) {
  const stat = toolStat(meta.key, finance);
  const Icon = meta.icon;
  return (
    <Link
      href={meta.href}
className="group flex flex-col justify-between rounded-card border border-primary/10 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/20"    >
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        {stat.active ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-verified">
            In use
          </span>
        ) : (
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/40">
            New
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-foreground">{meta.title}</p>
        <p className={`mt-1 text-2xl font-extrabold ${stat.active ? 'text-foreground' : 'text-foreground/30'}`}>
          {stat.headline}
        </p>
        <p className="mt-1 truncate text-xs text-foreground/60">{stat.detail}</p>
      </div>
    </Link>
  );
}

export default function UserOverview() {
  const router = useRouter();
  const { profile, user, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfId, setPdfId] = useState<string | null>(null);

  const activeToolCount = useMemo(() => {
    if (!overview) return 0;
    return TOOLS.filter((tool) => toolStat(tool.key, overview.finance).active).length;
  }, [overview]);

  async function loadOverview() {
    setLoading(true);
    setError('');
    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err: any) {
      console.warn('Failed to load dashboard overview:', err);
      setError(err?.message || 'Could not load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void loadOverview();
  }, [authLoading, user]);

  const displayName =
    profile?.name ||
    profile?.business_name ||
    (user?.phone ? `+91 ${user.phone.replace(/\D/g, '').slice(-10)}` : '');
  const greeting = displayName ? `Hello, ${displayName}` : 'Hello';

  function openAnalysis(id: string, section?: string) {
    const base = `/dashboard?analysis_id=${id}`;
    router.push(section ? `${base}&section=${section}` : base);
  }

  async function handleDownloadPdf(runId: string, reportId: string) {
    setPdfId(reportId);
    try {
      await downloadAnalysisPdf(runId);
    } catch (err: any) {
      alert(err?.message || 'Could not download the PDF report.');
    } finally {
      setPdfId(null);
    }
  }

  function AnalysisRow({ run }: { run: DashboardAnalysis }) {
    const location = [run.village_name, run.district_name].filter(Boolean).join(', ');
    return (
      <button
        type="button"
        onClick={() => openAnalysis(run.id)}
        className="flex w-full flex-col gap-3 rounded-card border border-primary/10 bg-white p-4 text-left transition hover:border-primary/20 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {run.business_category_name || 'Business analysis'}
              {location ? <span className="font-normal text-foreground/60"> • {location}</span> : null}
            </p>
            <p className="mt-0.5 text-xs text-foreground/40">{formatDate(run.created_at)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${statusChip(run.status)}`}>
            {run.status}
          </span>
          {run.overall_score != null && (
            <span className={`text-lg font-extrabold ${scoreColor(run.overall_score)}`}>
              {Math.round(run.overall_score)}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-foreground/30" />
        </div>
      </button>
    );
  }

  function SchemeRow({ scheme }: { scheme: DashboardScheme }) {
    const score = scheme.match_score != null ? Math.round(scheme.match_score * 100) : null;
    return (
      <button
        type="button"
        onClick={() => openAnalysis(scheme.matched_analysis_run_id, 'schemes')}
        className="flex w-full flex-col gap-3 rounded-card border border-primary/10 bg-white p-4 text-left transition hover:border-primary/20 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{scheme.name}</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              {scheme.agency_name || 'Government scheme'}
              {scheme.estimated_loan_amount ? ` • loan up to ${formatINR(scheme.estimated_loan_amount)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
          {scheme.analyses_count > 1 && (
            <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/60">
              {scheme.analyses_count} analyses
            </span>
          )}
          {score != null && (
            <span className={`w-12 text-right text-base font-extrabold ${scoreColor(score)}`}>{score}%</span>
          )}
          <ArrowRight className="h-4 w-4 text-foreground/30" />
        </div>
      </button>
    );
  }

  if (authLoading || (loading && user)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-sm text-foreground/60">Loading your dashboard…</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
      <div className="mx-auto flex flex-1 flex-col items-center justify-center p-10 text-center max-w-md">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Sign in to view your dashboard</h2>
        <p className="mt-2 text-sm text-foreground/60">
          Your personal finance overview, expense tracking, savings goals, and saved schemes are linked to your account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <p className="font-medium text-foreground/70">{error}</p>
        <button
          type="button"
          onClick={loadOverview}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    );
  }

  const finance = overview?.finance;
  const isEmpty = finance
    ? TOOLS.every((tool) => !toolStat(tool.key, finance).active) &&
      !overview?.analyses.length &&
      !overview?.schemes.length &&
      !overview?.reports.length
    : false;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6">
      {/* Greeting hero */}
      <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-white/75">
              <Sparkles className="h-3.5 w-3.5" /> My UdyamAI Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{greeting}</h1>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Here is everything you have started — your financial tools, matched schemes and reports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {overview?.analyses?.[0] && (
              <button
                type="button"
                onClick={() => openAnalysis(overview.analyses[0].id)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary shadow transition hover:-translate-y-0.5"
              >
                <BarChart3 className="h-4 w-4" /> View Feasibility Report
              </button>
            )}
            <Link
              href="/onboarding"
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow transition hover:-translate-y-0.5 ${
                overview?.analyses?.[0]
                  ? 'bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20'
                  : 'bg-white text-primary'
              }`}
            >
              <TrendingUp className="h-4 w-4" /> New analysis
            </Link>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20"
            >
              <Store className="h-4 w-4" /> Browse schemes
            </Link>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{overview?.analyses.length ?? 0}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Analyses</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{overview?.schemes.length ?? 0}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Matched schemes</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{overview?.reports.length ?? 0}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Reports</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <p className="text-2xl font-extrabold">{activeToolCount}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">Tools in use</p>
          </div>
        </div>
      </section>

      {isEmpty && (
        <section className="rounded-card border border-primary/15 bg-primary/5 shadow-card p-6 text-center">
          <h2 className="text-lg font-bold text-foreground">Start building your business plan</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-foreground/70">
            Run a feasibility analysis to get scheme recommendations, or open one of the financial tools below to begin tracking.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Start a feasibility analysis <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* Financial tools */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Financial tools</h2>
          <p className="text-xs text-foreground/40">Tools you have opted into</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {finance &&
            TOOLS.map((tool) => <ToolCard key={tool.key} meta={tool} finance={finance} />)}
        </div>
      </section>

      {/* Matched schemes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recommended schemes</h2>
          {overview && overview.schemes.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-status-verified">
              {overview.schemes.length} matched
            </span>
          )}
        </div>
        {overview && overview.schemes.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {overview.schemes.map((scheme) => (
              <SchemeRow key={scheme.scheme_id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-primary/20 bg-background p-6 text-center">
            <BadgeCheck className="mx-auto h-8 w-8 text-foreground/30" />
            <p className="mt-2 text-sm font-medium text-foreground/70">
              No scheme matches yet — run an analysis to see schemes you may be eligible for.
            </p>
            <Link
              href="/onboarding"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Get scheme recommendations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Analyses */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Your analyses</h2>
          {overview && overview.analyses.length > 0 && (
            <Link href="/onboarding" className="text-xs font-semibold text-primary hover:text-primary/80">
              + New analysis
            </Link>
          )}
        </div>
        {overview && overview.analyses.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {overview.analyses.map((run) => (
              <AnalysisRow key={run.id} run={run} />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-primary/20 bg-background p-6 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-foreground/30" />
            <p className="mt-2 text-sm font-medium text-foreground/70">
              You have not run a feasibility analysis yet.
            </p>
          </div>
        )}
      </section>

      {/* Reports */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Your reports</h2>
          <span className="text-xs text-foreground/40">Generated from your analyses</span>
        </div>
        {overview && overview.reports.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {overview.reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col gap-3 rounded-card border border-primary/10 bg-white shadow-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {report.title || 'Analysis report'}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground/40">
                      {formatDate(report.created_at)}
                      {report.language ? ` • ${report.language.toUpperCase()}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => openAnalysis(report.analysis_run_id)}
                    className="rounded-lg border border-primary/15 px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-primary/5"
                  >
                    View analysis
                  </button>
                  <button
                    type="button"
                    disabled={pdfId === report.id}
                    onClick={() => handleDownloadPdf(report.analysis_run_id, report.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {pdfId === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-primary/20 bg-background p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-foreground/30" />
            <p className="mt-2 text-sm font-medium text-foreground/70">
              No reports yet — they appear here after you complete an analysis.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
