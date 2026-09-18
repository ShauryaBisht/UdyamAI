'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface RiskSectionProps {
  data?: any;
}

function getRiskLevelBadge(level: string) {
  const l = String(level || '').toLowerCase();

  if (l.includes('low')) {
    return 'bg-primary/10 text-status-verified border-primary/20';
  }

  if (l.includes('high') || l.includes('critical')) {
    return 'bg-danger/10 text-status-risk border-danger/20';
  }

  return 'bg-accent/15 text-status-warning border-accent/30';
}
const DEFAULT_RISKS: never[] = [];

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
        <div className="rounded-card border border-primary/10 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground/60">Risk Profile Index</span>
            <ShieldCheck className="h-5 w-5 text-status-verified"/>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-metric-lg text-foreground">
              {riskScore ?? (aiRisks.length > 0 ? `~${Math.max(20, 60 - aiRisks.length * 5)}` : '—')}
            </span>
            {(riskScore != null || aiRisks.length > 0) && <span className="text-sm font-medium text-foreground/40">/100</span>}
          </div>
          <p className="mt-1 text-xs text-foreground/60">Higher score indicates lower operational risk</p>
        </div>

        <div className="rounded-card border border-primary/10 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground/60">Risk Rating</span>
            <AlertTriangle className="h-5 w-5 text-status-warning" />
          </div>
          <h3 className="mt-2 text-2xl font-extrabold text-foreground">
            {derivedRiskLevel || riskLevel}
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            {riskScore != null
              ? 'Evaluated against 12 risk metrics'
              : derivedRiskLevel
                ? `Derived from ${aiRisks.length} AI-identified risk factors`
                : 'Awaiting feasibility analysis'}
          </p>
        </div>

        <div className="rounded-card border border-primary/10 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground/60">Mitigation Coverage</span>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mt-2 text-2xl font-extrabold text-foreground">
            {riskList.length > 0 ? `${mitigationCoverage}% Covered` : 'Pending'}
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            {riskList.length > 0
              ? `${risksWithMitigation.length} of ${riskList.length} risks have mitigation plans`
              : 'Risk factors pending analysis'}
          </p>
        </div>
      </div>

      {/* SWOT Analysis Matrix */}
      <div className="rounded-card border border-primary/10 bg-white p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Enterprise SWOT Matrix</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="rounded-card border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-foreground text-sm">Key Strengths</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              {strengths.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="rounded-card border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-foreground text-sm">Growth Opportunities</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              {opportunities.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="rounded-card border border-danger/20 bg-danger/5 p-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-status-risk" />
              <h4 className="font-bold text-foreground text-sm">External Threats & Vulnerabilities</h4>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground">
              {threats.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-status-risk font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actionable Risk Assessment & Mitigation Plan */}
      <div className="rounded-card border border-primary/10 bg-white p-6 shadow-card">
        <div className="flex items-center justify-between mb-4 border-b border-primary/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-status-warning" />
            <h3 className="text-lg font-bold text-foreground">
              Risk Factors & Actionable Mitigation Plan
            </h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-accent/15 text-status-warning border border-accent/30 rounded-full">
            {riskList.length > 0 ? `${riskList.length} Risk Factors Identified` : aiRisks.length > 0 ? `${aiRisks.length} AI-Identified Risks` : '0 Risks Identified'}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {riskList.length === 0 && aiRisks.length === 0 && (
            <p className="text-sm text-foreground/60">No risk factors were identified for this analysis run.</p>
          )}
          {riskList.map((r: any, idx: number) => {
            const factorName = r.risk_factor || r.factor || r.risk_type || `Operational Risk ${idx + 1}`;
            const category = r.category || 'Enterprise Risk';
            const level = r.level || 'Medium';
            const mitigation = r.mitigation || r.mitigation_strategy || r.action_plan || null;

            return (
              <div
                key={idx}
                className="rounded-card border border-primary/10 bg-background p-5 hover:bg-primary/5 transition shadow-card flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-status-warning shrink-0" />
                    <h4 className="font-bold text-foreground text-sm sm:text-base">{factorName}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground/60 bg-white px-2.5 py-0.5 rounded border border-primary/10">
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

                <div className="bg-white rounded-lg border border-primary/10 p-3.5 mt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1">
                    Mitigation Strategy & Action Plan
                  </p>
                  {mitigation ? (
                    <p className="text-sm text-foreground/70 leading-relaxed font-normal">
                      {mitigation}
                    </p>
                  ) : (
                    <p className="text-sm text-foreground/40 italic">
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
                className="rounded-card border border-primary/15 bg-primary/5 p-5 shadow-card flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-bold text-foreground text-sm sm:text-base">{riskText}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-white px-2.5 py-0.5 rounded border border-primary/15">
                      AI-Identified
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRiskLevelBadge(aiLevel)}`}>
                      {aiLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-primary/10 p-3.5 mt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    AI-Generated Mitigation Guidance
                  </p>
                  <p className="text-sm text-foreground/60 italic">
                    Consult the matched scheme documents and financial plan to build a specific mitigation action.
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Confidence Badge */}
        {aiConfidence && (
          <div className="mt-4 pt-3 border-t border-primary/10 flex items-center gap-2">
            <span className="text-xs font-medium text-foreground/40">AI Confidence:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              aiConfidence === 'high' ? 'bg-primary/10 text-status-verified'
: aiConfidence === 'medium' ? 'bg-accent/15 text-status-warning'
: 'bg-foreground/5 text-foreground/60'
            }`}>
              {aiConfidence.toUpperCase()}
            </span>
            {aiModelName && aiModelName !== 'unavailable' && (
              <span className="text-xs text-foreground/40">via {aiModelName}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
