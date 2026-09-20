import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricDisplayProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  scoreVariant?: 'verified' | 'warning' | 'risk' | 'neutral' | 'accent' | 'primary';
  subtext?: string;
  className?: string;
}

export function MetricDisplay({
  label,
  value,
  prefix,
  suffix,
  size = 'md',
  trend,
  scoreVariant,
  subtext,
  className = '',
}: MetricDisplayProps) {
  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl font-bold tracking-tight',
    md: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
    lg: 'text-4xl sm:text-5xl font-black tracking-tight',
    xl: 'text-5xl sm:text-6xl font-black tracking-tighter',
  };

  const scoreColorClasses = {
    verified: 'text-emerald-600',
    primary: 'text-primary',
    warning: 'text-amber-600',
    risk: 'text-rose-600',
    accent: 'text-amber-500',
    neutral: 'text-foreground',
  };

  const valueColor = scoreVariant ? scoreColorClasses[scoreVariant] : 'text-foreground';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground-muted">
        {label}
      </span>

      <div className="flex items-baseline gap-1.5 flex-wrap">
        {prefix && (
          <span className="text-lg sm:text-2xl font-bold text-foreground-muted/80 tabular-nums">
            {prefix}
          </span>
        )}
        <span className={`font-financial tabular-nums ${sizeClasses[size]} ${valueColor}`}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm sm:text-base font-semibold text-foreground-muted">
            {suffix}
          </span>
        )}

        {trend && (
          <div
            className={`inline-flex items-center gap-0.5 ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              trend.direction === 'up'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : trend.direction === 'down'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{trend.value}</span>
            {trend.label && <span className="opacity-80 font-normal ml-0.5">({trend.label})</span>}
          </div>
        )}
      </div>

      {subtext && <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">{subtext}</p>}
    </div>
  );
}

export default MetricDisplay;
