import React from 'react';
import { Sparkles, FlaskConical, ArrowRight } from 'lucide-react';

export interface DemoBadgeProps {
  label?: string;
  variant?: 'badge' | 'tag' | 'banner';
  className?: string;
}

export function DemoBadge({
  label = 'SAMPLE SCENARIO',
  variant = 'badge',
  className = '',
}: DemoBadgeProps) {
  if (variant === 'banner') {
    return (
      <div
        className={`flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-900 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <FlaskConical className="w-4 h-4 shrink-0" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Demo Mode</span>
          <span className="text-xs text-purple-700/80">— {label}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-200/60 text-purple-800">
          Simulated Data
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 shadow-sm ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export interface DemoScenarioButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  scenarioTitle?: string;
  scenarioDescription?: string;
  loading?: boolean;
}

export function DemoScenarioButton({
  scenarioTitle = 'Load Sample Scenario',
  scenarioDescription,
  loading = false,
  className = '',
  ...props
}: DemoScenarioButtonProps) {
  return (
    <button
      type="button"
      className={`group relative flex items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50/60 via-indigo-50/40 to-blue-50/40 border border-purple-200/80 hover:border-primary/50 hover:bg-white text-foreground shadow-card hover:shadow-card-hover transition-all duration-300 text-left ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-105 transition-transform">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{scenarioTitle}</span>
            <DemoBadge label="DEMO" />
          </div>
          {scenarioDescription && (
            <p className="text-xs text-foreground-muted mt-0.5">{scenarioDescription}</p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full bg-primary hover:bg-primary-600 text-white transition-all shadow-fintech-btn">
          {loading ? 'Loading...' : 'Try Demo'}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

export default DemoBadge;
