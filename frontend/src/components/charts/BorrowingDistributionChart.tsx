'use client';

import React from 'react';
import ChartCard from './ChartCard';

export interface BorrowingRecord {
  purpose: string;
  amount: number;
  status: 'exploring' | 'applied' | 'approved' | 'rejected';
}

interface BorrowingDistributionChartProps {
  records?: BorrowingRecord[];
  title?: string;
  subtitle?: string;
  className?: string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

const STATUS_COLORS: Record<string, string> = {
  exploring: '#94A3B8',
  applied: '#3B82F6',
  under_review: '#6366F1',
  approved: '#10B981',
  disbursed: '#059669',
  rejected: '#EF4444',
};

export default function BorrowingDistributionChart({
  records = [],
  title = 'Financing Pipeline Breakdown',
  subtitle = 'Status of active credit requests and applications',
  className = '',
}: BorrowingDistributionChartProps) {
  const safeRecords = (records || []).filter(Boolean);
  if (safeRecords.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Add micro borrowing applications to visualize approval distribution."
        className={className}
      />
    );
  }

  const statusSums: Record<string, number> = { exploring: 0, applied: 0, approved: 0, rejected: 0 };
  for (const r of safeRecords) {
    const rawStatus = (r?.status || 'exploring').toLowerCase();
    const statusKey = ['approved', 'disbursed'].includes(rawStatus)
      ? 'approved'
      : ['applied', 'under_review'].includes(rawStatus)
      ? 'applied'
      : rawStatus === 'rejected'
      ? 'rejected'
      : 'exploring';
    const amt = Math.max(0, Number(r?.amount) || 0);
    statusSums[statusKey] = (statusSums[statusKey] || 0) + amt;
  }
  const total = Object.values(statusSums).reduce((a, b) => a + b, 0);

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="flex flex-col gap-5">
        {/* Horizontal stacked bar */}
        <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
          {Object.entries(statusSums).map(([status, amount]) => {
            if (amount <= 0 || total <= 0) return null;
            const pct = (amount / total) * 100;
            return (
              <div
                key={status}
                style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }}
                className="h-full transition-all duration-300"
                title={`${status}: ${formatINR(amount)} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Legend / Breakdown grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {(['approved', 'applied', 'exploring', 'rejected'] as const).map((status) => {
            const amt = statusSums[status] || 0;
            const pct = total > 0 ? ((amt / total) * 100).toFixed(0) : '0';
            return (
              <div key={status} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 capitalize">
                    {status}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-800">{formatINR(amt)}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{pct}% of total requests</div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
