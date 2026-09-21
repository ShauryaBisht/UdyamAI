'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface RiskSectionProps {
  data?: any;
}

function getRiskLevelBadge(level: string) {
  const l = String(level || '').toLowerCase();

  if (l.includes('low')) {
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  }

  if (l.includes('high') || l.includes('critical')) {
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
  }

  return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
}

export default function RiskSection({ data }: RiskSectionProps) {
  const feas = data?.feasibility || {};
  const aiAdvice = data?.ai_advice || {};
  const riskScore = feas.risk_score != null ? Math.round(feas.risk_score) : null;
  const riskLevel =
    riskScore == null ? 'Not assessed' : riskScore >= 70 ? 'Low Risk' : riskScore >= 40 ? 'Medium Risk' : 'High Risk';

  const rawRisks = data?.risks || [];
  const riskList = Array.isArray(rawRisks) ? rawRisks : [];

  // AI-derived risk indicators when backend risk_score is missing
  const aiRisks: string[] = aiAdvice.risks || [];
  const aiWeaknesses: string[] = aiAdvice.weaknesses || [];
  const aiConfidence = aiAdvice.confidence || null;
  const aiModelName = aiAdvice.model_name || null;

  // Derive a risk level from AI data when feasibility score is missing
  const derivedRiskLevel =
    riskScore != null ? riskLevel
    : aiRisks.length > 3 ? 'High Risk'
    : aiRisks.length > 0 ? 'Medium Risk'
    : aiWeaknesses.length > 2 ? 'Medium Risk'
    : null;

  // Calculate mitigation coverage: only count risks that actually have mitigation text
  const risksWithMitigation = riskList.filter((r: any) => {
    const mitigation = r.mitigation || r.mitigation_strategy || r.action_plan;
    return mitigation && String(mitigation).trim().length > 0;
  });
  const mitigationCoverage = riskList.length > 0
    ? Math.round((risksWithMitigation.length / riskList.length) * 100)
    : 0;

  const swot = feas.swot || data?.ai_advice?.swot || {};
  const strengths = data?.ai_advice?.reasoning || swot.strengths || (swot as any).strength_indicators || [];
  const opportunities =
    data?.ai_advice?.opportunities || swot.opportunities || (swot as any).opportunity_indicators || [];
  const threats = data?.ai_advice?.threats || swot.threats || (swot as any).threat_indicators || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Risk Profile Header & Score Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Profile Index</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-financial tracking-tight text-foreground">
              {riskScore ?? (aiRisks.length > 0 ? `~${Math.max(20, 60 - aiRisks.length * 5)}` : '—')}
            </span>
            {(riskScore != null || aiRisks.length > 0) && <span className="text-xs font-medium text-muted-foreground">/100</span>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Higher score indicates lower operational risk</p>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Rating</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="mt-2 text-2xl font-extrabold text-foreground">
            {derivedRiskLevel || riskLevel}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {riskScore != null
              ? 'Evaluated against 12 risk metrics'
              : derivedRiskLevel
                ? `Derived from ${aiRisks.length} AI risk factors`
                : 'Awaiting feasibility analysis'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mitigation Coverage</span>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-2 text-2xl font-extrabold font-financial text-foreground">
            {riskList.length > 0 ? `${mitigationCoverage}% Covered` : 'Pending'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {riskList.length > 0
              ? `${risksWithMitigation.length} of ${riskList.length} risks mitigated`
              : 'Risk factors pending analysis'}
          </p>
        </div>
      </div>

      {/* SWOT Analysis Matrix */}
      <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">Enterprise SWOT Matrix</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-foreground text-sm">Key Strengths</h4>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-foreground">
              {strengths.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-foreground text-sm">Growth Opportunities</h4>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-foreground">
              {opportunities.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h4 className="font-bold text-foreground text-sm">External Threats & Vulnerabilities</h4>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-foreground">
              {threats.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actionable Risk Assessment & Mitigation Plan */}
      <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Risk Factors & Mitigation Plan
            </h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full self-start sm:self-auto">
            {riskList.length > 0 ? `${riskList.length} Risk Factors Identified` : aiRisks.length > 0 ? `${aiRisks.length} AI Risks` : '0 Risks Identified'}
          </span>
        </div>

        {/* Category breakdown visual bars */}
        {riskList.length > 0 && (() => {
          const catCounts: Record<string, number> = {};
          riskList.forEach((r: any) => {
            const cat = r.category || 'General';
            catCounts[cat] = (catCounts[cat] || 0) + 1;
          });
          const maxCount = Math.max(...Object.values(catCounts), 1);
          return (
            <div className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-[#1C2128] border border-slate-200 dark:border-[#2B313C]">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Risk Distribution by Domain
              </p>
              <div className="space-y-2">
                {Object.entries(catCounts).map(([cat, cnt]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{cat}</span>
                      <span className="text-muted-foreground">{cnt} {cnt === 1 ? 'factor' : 'factors'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-[#2B313C] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((cnt / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="flex flex-col gap-4">
          {riskList.length === 0 && aiRisks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No risk factors were identified for this analysis run.</p>
          )}
          {riskList.map((r: any, idx: number) => {
            const factorName = r.risk_factor || r.factor || r.risk_type || `Operational Risk ${idx + 1}`;
            const category = r.category || 'Enterprise Risk';
            const level = r.level || 'Medium';
            const mitigation = r.mitigation || r.mitigation_strategy || r.action_plan || null;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-slate-50/50 dark:bg-[#1C2128]/60 p-5 hover:bg-slate-50 dark:hover:bg-[#1C2128] transition shadow-subtle flex flex-col gap-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#2B313C] pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <h4 className="font-bold text-foreground text-sm sm:text-base">{factorName}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground bg-white dark:bg-[#1F242C] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-[#2B313C]">
                      {category}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRiskLevelBadge(
                        level
                      )}`}
                    >
                      {String(level).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161B22] rounded-xl border border-slate-200 dark:border-[#2B313C] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Mitigation Strategy & Action Plan
                  </p>
                  {mitigation ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mitigation}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">
                      Mitigation plan pending — review risk factors with financial advisor
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI-derived risk items when backend risk list is empty */}
          {riskList.length === 0 && aiRisks.length > 0 && aiRisks.map((riskText: string, idx: number) => {
            const isHighSeverity = idx < 2;
            const aiLevel = isHighSeverity ? 'Medium' : 'Low';
            return (
              <div
                key={`ai-risk-${idx}`}
                className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-5 shadow-subtle flex flex-col gap-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/15 dark:border-primary/25 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-bold text-foreground text-sm sm:text-base">{riskText}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-white dark:bg-[#1F242C] px-2.5 py-0.5 rounded-full border border-primary/15 dark:border-primary/30">
                      AI-Identified
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRiskLevelBadge(aiLevel)}`}>
                      {aiLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#161B22] rounded-xl border border-slate-200 dark:border-[#2B313C] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                    AI Mitigation Guidance
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Consult the matched scheme documents and financial plan to build a specific mitigation action.
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Confidence and Sources Badge */}
        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
          {aiConfidence && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">AI Confidence:</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                aiConfidence === 'high' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : aiConfidence === 'medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-[#1F242C] text-muted-foreground border border-slate-200 dark:border-[#2B313C]'
              }`}>
                {aiConfidence.toUpperCase()}
              </span>
              {aiModelName && aiModelName !== 'unavailable' && (
                <span className="text-xs text-muted-foreground">via {aiModelName}</span>
              )}
            </div>
          )}
          {aiAdvice.sources && aiAdvice.sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
              <span className="font-semibold">Sources:</span>
              {aiAdvice.sources.map((s: any, idx: number) => (
                <span key={idx} className="bg-slate-100 dark:bg-[#1F242C] dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-[#2B313C] font-mono text-[11px]">
                  {s.claim || s.source_type || `Source #${idx + 1}`}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

