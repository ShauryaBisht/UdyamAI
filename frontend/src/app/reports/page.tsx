'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowRight,
  Download,
  Sparkles,
  BarChart2,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  MapPin,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  Award,
  Layers,
  Building2,
  Volume2,
  VolumeX,
} from 'lucide-react';

import AppShell from '@/components/ui/AppShell';
import {
  getDashboardOverview,
  downloadAnalysisPdf,
  type DashboardAnalysis,
  type DashboardReport,
  type DashboardOverviewData,
} from '@/lib/api';
import { useTranslation } from '@/stores/languageStore';
import { useSpeech } from '@/hooks/useSpeech';

export default function ReportsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isSpeaking, speakingId, toggleSpeak } = useSpeech();

  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'moderate' | 'risk'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err: any) {
      console.warn('Failed to load dashboard overview for reports:', err);
      setError(err?.message || 'Could not load your generated reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  async function handleDownload(analysisId: string) {
    try {
      setDownloadingId(analysisId);
      setDownloadError(null);
      await downloadAnalysisPdf(analysisId);
      setDownloadSuccessId(analysisId);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    } catch (err: any) {
      setDownloadError(err?.message || 'Failed to download report PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }

  function formatDate(value?: string | null): string {
    if (!value) return 'Recent';
    try {
      return new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  }

  // Combined list of analysis runs / reports
  const allReports = useMemo(() => {
    if (!overview?.analyses) return [];
    return overview.analyses.map((analysis) => {
      // Find matching report item if any
      const matchingReport = overview.reports?.find(
        (r) => r.analysis_run_id === analysis.id
      );

      const title =
        matchingReport?.title ||
        (analysis.business_category_name
          ? `${analysis.business_category_name} Feasibility Dossier`
          : `Enterprise Feasibility Report #${analysis.id.slice(0, 6)}`);

      const locationStr = [
        analysis.village_name,
        analysis.taluka_name,
        analysis.district_name,
      ]
        .filter(Boolean)
        .join(', ');

      return {
        id: analysis.id,
        title,
        businessName: analysis.business_category_name || 'Agro / Rural Enterprise',
        location: locationStr || 'Maharashtra, India',
        district: analysis.district_name || 'Regional',
        score: analysis.overall_score != null ? Math.round(analysis.overall_score) : null,
        status: analysis.status || 'completed',
        createdAt: analysis.created_at,
        completedAt: analysis.completed_at,
        language: matchingReport?.language || 'en',
      };
    });
  }, [overview]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allReports.filter((report) => {
      // Search matching
      const matchesSearch =
        !searchQuery.trim() ||
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.toLowerCase().includes(searchQuery.toLowerCase());

      // Score filter
      if (!matchesSearch) return false;
      if (scoreFilter === 'all') return true;
      if (scoreFilter === 'high') return report.score !== null && report.score >= 75;
      if (scoreFilter === 'moderate')
        return report.score !== null && report.score >= 50 && report.score < 75;
      if (scoreFilter === 'risk') return report.score === null || report.score < 50;
      return true;
    });
  }, [allReports, searchQuery, scoreFilter]);

  // Metric stats
  const totalCount = allReports.length;
  const highFeasibilityCount = allReports.filter((r) => r.score !== null && r.score >= 75).length;
  const scoresWithValues = allReports.filter((r) => r.score !== null).map((r) => r.score as number);
  const avgScore =
    scoresWithValues.length > 0
      ? Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length)
      : null;

  return (
    <AppShell>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        
        {/* ========================================================================= */}
        {/* 1. TOP HERO BANNER                                                        */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-gradient-to-r from-[#1A1D24] via-[#222731] to-[#2B323F] text-white p-6 sm:p-8 lg:p-9 shadow-md border border-neutral-800/60 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.04] rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 transition-transform hover:scale-105">
                <Sparkles className="h-3.5 w-3.5 text-slate-200 animate-pulse" /> Feasibility Archives
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Generated Feasibility Reports
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-2.5 leading-relaxed">
                Access your complete history of AI enterprise feasibility assessments, banker dossiers, unit economics, and risk models.
              </p>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-foreground font-bold text-xs sm:text-sm shadow-sm hover:bg-neutral-100 hover:shadow-md hover:scale-105 transition-all duration-200 active:scale-95"
              >
                <TrendingUp className="h-4 w-4 text-neutral-800" /> Run New Feasibility Analysis
              </Link>
            </div>
          </div>

          {/* Banner Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 relative z-10">
            <div className="bg-white/[0.06] hover:bg-white/[0.12] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-black font-financial text-white">{totalCount}</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 mt-1">
                Generated Reports
              </p>
            </div>
            <div className="bg-white/[0.06] hover:bg-white/[0.12] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-black font-financial text-emerald-400">
                {highFeasibilityCount}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 mt-1">
                High Feasibility (≥75)
              </p>
            </div>
            <div className="bg-white/[0.06] hover:bg-white/[0.12] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-black font-financial text-slate-200">
                {avgScore != null ? `${avgScore}/100` : '—'}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 mt-1">
                Avg Feasibility Score
              </p>
            </div>
            <div className="bg-white/[0.06] hover:bg-white/[0.12] hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <p className="text-2xl sm:text-3xl font-black font-financial text-white">
                {overview?.schemes?.length ?? 0}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 mt-1">
                Matched Subsidies
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
        {/* 2. SEARCH & FILTER CONTROLS                                               */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-border shadow-subtle">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by business name, village, or district..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-neutral-50 dark:bg-[#1F242C] border border-border rounded-xl focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-[#161B22] text-foreground transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Score Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-foreground-muted flex items-center gap-1 mr-1 shrink-0">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setScoreFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                scoreFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-[#1F242C] text-foreground-muted hover:bg-neutral-200 dark:hover:bg-[#272D37]'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setScoreFilter('high')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                scoreFilter === 'high'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              High Feasibility (≥75)
            </button>
            <button
              type="button"
              onClick={() => setScoreFilter('moderate')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                scoreFilter === 'moderate'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800'
              }`}
            >
              Moderate (50–74)
            </button>
            <button
              type="button"
              onClick={() => setScoreFilter('risk')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                scoreFilter === 'risk'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800'
              }`}
            >
              Need Review (&lt;50)
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. REPORTS LIST / GRID                                                    */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#161B22] rounded-3xl border border-border shadow-subtle">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-semibold text-foreground">Loading your generated reports...</p>
            <p className="text-xs text-foreground-muted mt-1">Retrieving latest feasibility records from database</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#161B22] rounded-3xl border border-border shadow-subtle text-center">
            <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-foreground">Failed to Load Reports</h3>
            <p className="text-xs text-foreground-muted mt-1 max-w-md">{error}</p>
            <button
              onClick={() => void loadReports()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-600 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 bg-white dark:bg-[#161B22] rounded-3xl border border-border shadow-subtle text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {searchQuery || scoreFilter !== 'all'
                ? 'No reports match your filters'
                : 'No feasibility reports generated yet'}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-md leading-relaxed">
              {searchQuery || scoreFilter !== 'all'
                ? 'Try adjusting your search keywords or resetting the score filter to see all generated reports.'
                : 'Generate your first comprehensive feasibility assessment with real market viability, unit economics, risk matrices, and matched subsidies.'}
            </p>
            {searchQuery || scoreFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setScoreFilter('all');
                }}
                className="mt-5 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-[#1F242C] hover:bg-neutral-200 dark:hover:bg-[#272D37] text-foreground font-bold text-xs transition"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/onboarding"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-xs sm:text-sm shadow-fintech-btn hover:bg-primary-600 transition active:scale-95"
              >
                <TrendingUp className="h-4 w-4" /> Start Feasibility Analysis
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => {
              const isDownloading = downloadingId === report.id;
              const isDownloaded = downloadSuccessId === report.id;

              const score = report.score;
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
                  ? 'Pending Analysis'
                  : score >= 75
                  ? 'High Feasibility'
                  : score >= 50
                  ? 'Moderate Viability'
                  : 'High Risk Profile';

              return (
                <div
                  key={report.id}
                  className="bg-white dark:bg-[#161B22] rounded-3xl border border-border p-6 shadow-subtle hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Type icon & Score Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <BarChart2 className="h-6 w-6" />
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border transition-colors ${scoreBadgeColor}`}
                        >
                          {score !== null ? `${score}/100` : '—'} • {scoreLabel}
                        </span>
                        <span className="text-[10px] font-mono text-foreground-muted mt-1">
                          Run #{report.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    {/* Title & Business Name */}
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {report.title}
                    </h3>
                    <p className="text-xs font-medium text-foreground-muted mt-1 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="truncate">{report.businessName}</span>
                    </p>

                    {/* Location & Date Meta */}
                    <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 text-xs text-foreground-muted">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                        <span>Generated on {formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                    {/* Action Buttons Footer */}
                  <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard?analysis_id=${report.id}&section=report`)}
                      className="flex-1 py-2.5 px-4 rounded-full bg-primary hover:bg-primary-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 active:scale-95"
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> View Report
                    </button>

                    {/* Read Aloud Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const speechText = `${report.title} for ${report.businessName} in ${report.location}. Feasibility score: ${score !== null ? score : 'Pending'} out of 100. Status: ${scoreLabel}.`;
                        toggleSpeak(speechText, `report-${report.id}`);
                      }}
                      className={`py-2.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
                        isSpeaking && speakingId === `report-${report.id}`
                          ? 'bg-primary text-white animate-pulse'
                          : 'bg-neutral-100 dark:bg-[#1F242C] hover:bg-neutral-200 dark:hover:bg-[#272D37] text-foreground'
                      }`}
                      title="Listen to report summary"
                    >
                      {isSpeaking && speakingId === `report-${report.id}` ? (
                        <VolumeX className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => void handleDownload(report.id)}
                      className="py-2.5 px-3.5 rounded-full bg-neutral-100 dark:bg-[#1F242C] hover:bg-neutral-200 dark:hover:bg-[#272D37] text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-60 hover:scale-105"
                      title="Download Official PDF Dossier"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : isDownloaded ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 animate-scale-in" />
                      ) : (
                        <Download className="h-3.5 w-3.5 text-foreground-muted hover:text-primary transition-colors" />
                      )}
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. INSTITUTIONAL PACKS & EXPORT ADVISORY                                  */}
        {/* ========================================================================= */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">
              Institutional Export Formats & Toolkits
            </h2>
            <span className="text-xs font-semibold text-foreground-muted">Verified formats for bankers & agencies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-border p-6 shadow-subtle flex flex-col justify-between hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Bank Loan Readiness Pack</h3>
                <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                  Includes DSCR metrics, working capital cycle, collateral assumptions, and repayment schedule tailored for SBI and NABARD.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Credit Grade
                </span>
                <Link
                  href="/borrowing"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 group/link"
                >
                  Borrowing Desk <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-border p-6 shadow-subtle flex flex-col justify-between hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Government Subsidy Matrix</h3>
                <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                  Instant mapping of capital investment subsidies under PMEGP, CMEGP, PMFME, and Mudra Shishu/Kishor categories.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-primary bg-primary-50 dark:bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary-100 dark:border-primary/30">
                  Govt Schemes
                </span>
                <Link
                  href="/schemes"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 group/link"
                >
                  Match Schemes <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161B22] rounded-3xl border border-border p-6 shadow-subtle flex flex-col justify-between hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">AI Margin & Growth Advisory</h3>
                <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
                  Prescriptive operational guidance detecting raw material price surges, pricing power, and distribution expansion.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  AI Prescriptive
                </span>
                <Link
                  href="/cashflow"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 group/link"
                >
                  Cashflow Hub <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

      </main>
    </AppShell>
  );
}
