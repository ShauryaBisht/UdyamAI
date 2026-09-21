import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';

export type StatusType = 'verified' | 'warning' | 'risk' | 'neutral' | 'demo' | 'active';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}: StatusBadgeProps) {
  const configs: Record<
    StatusType,
    {
      bg: string;
      text: string;
      border: string;
      icon: React.ElementType;
      defaultLabel: string;
    }
  > = {
    verified: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
      defaultLabel: 'Verified',
    },
    active: {
      bg: 'bg-blue-50',
      text: 'text-primary',
      border: 'border-blue-200',
      icon: CheckCircle2,
      defaultLabel: 'Active',
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: AlertTriangle,
      defaultLabel: 'Caution / Review',
    },
    risk: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: AlertCircle,
      defaultLabel: 'High Risk',
    },
    neutral: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: Info,
      defaultLabel: 'Info',
    },
    demo: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: Sparkles,
      defaultLabel: 'Demo Scenario',
    },
  };

  const config = configs[status] || configs.neutral;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold gap-1',
    md: 'px-3 py-1 text-xs sm:text-sm font-semibold gap-1.5',
    lg: 'px-4 py-1.5 text-sm font-bold gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${config.text} ${config.border} ${sizeStyles[size]} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
