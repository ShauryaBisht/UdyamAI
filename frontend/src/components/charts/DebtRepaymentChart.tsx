'use client';

import React from 'react';
import ChartCard from './ChartCard';

export interface DebtItem {
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
}

interface DebtRepaymentChartProps {
  debts?: DebtItem[];
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

export default function DebtRepaymentChart({
  debts = [],
  title = 'Debt Repayment Progress',
  subtitle = 'Principal reduction and paid-off status across active loans',
  className = '',
}: DebtRepaymentChartProps) {
  const safeDebts = (debts || [])
    .filter(Boolean)
    .map((d) => {
      const totalAmount = Math.max(0, Number(d?.totalAmount) || 0);
      const remainingAmount = Math.max(0, Math.min(totalAmount, Number(d?.remainingAmount ?? d?.totalAmount) || 0));
      return {
        name: String(d?.name || 'Loan Facility'),
        totalAmount,
        remainingAmount,
        interestRate: d?.interestRate !== undefined ? Number(d.interestRate) : undefined,
      };
    });

  if (safeDebts.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Add debt records to visualize outstanding liability reduction."
        className={className}
      />
    );
  }

  const totalDebt = safeDebts.reduce((sum, d) => sum + d.totalAmount, 0);
  const remainingDebt = safeDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const paidDebt = Math.max(0, totalDebt - remainingDebt);
  const overallProgress = totalDebt > 0 ? Math.round((paidDebt / totalDebt) * 100) : 0;

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="flex flex-col gap-6">
        {/* Overall progress bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
            <span>Overall Portfolio Repaid</span>
            <span className="text-primary font-extrabold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
            <span>Paid: {formatINR(paidDebt)}</span>
            <span>Outstanding: {formatINR(remainingDebt)}</span>
          </div>
        </div>

        {/* Individual loan bars */}
        <div className="flex flex-col gap-3">
          {debts.map((debt, idx) => {
            const paid = Math.max(0, debt.totalAmount - debt.remainingAmount);
            const pct = debt.totalAmount > 0 ? Math.round((paid / debt.totalAmount) * 100) : 0;

            return (
              <div key={debt.name || idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800 font-bold">{debt.name}</span>
                  <span className="text-slate-500">
                    {formatINR(debt.remainingAmount)} left of {formatINR(debt.totalAmount)} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
