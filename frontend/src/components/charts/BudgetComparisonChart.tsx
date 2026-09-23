'use client';

import React from 'react';
import ChartCard from './ChartCard';

export interface BudgetItem {
  category: string;
  budgetLimit: number;
  actualSpent: number;
}

interface BudgetComparisonChartProps {
  items?: BudgetItem[];
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

export default function BudgetComparisonChart({
  items = [],
  title = 'Budget vs. Actual Expenditure',
  subtitle = 'Category-level limits and variance tracking',
  className = '',
}: BudgetComparisonChartProps) {
  const safeItems = (items || [])
    .filter(Boolean)
    .map((it) => ({
      category: String(it?.category || 'Operational Allocation'),
      budgetLimit: Math.max(0, Number(it?.budgetLimit) || 0),
      actualSpent: Math.max(0, Number(it?.actualSpent) || 0),
    }));

  if (safeItems.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Set category budgets to track actual spend against planned allocations."
        className={className}
      />
    );
  }

  const maxVal = Math.max(...safeItems.flatMap((i) => [i.budgetLimit, i.actualSpent]), 1000);

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="flex flex-col gap-4">
        {safeItems.map((item, idx) => {
          const limitPct = (item.budgetLimit / maxVal) * 100;
          const spentPct = (item.actualSpent / maxVal) * 100;
          const isOverBudget = item.actualSpent > item.budgetLimit;
          const variance = item.budgetLimit - item.actualSpent;

          return (
            <div key={item.category || idx} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span className="capitalize">{item.category.replace(/_/g, ' ')}</span>
                <span className={isOverBudget ? 'text-rose-600 font-extrabold' : 'text-slate-500'}>
                  {formatINR(item.actualSpent)} / {formatINR(item.budgetLimit)}
                  {isOverBudget ? ' (Exceeded)' : ` (${formatINR(variance)} left)`}
                </span>
              </div>
              {/* Dual bar: limit in grey background, actual spent overlay */}
              <div className="relative w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                {/* Budget limit outline / marker */}
                <div
                  className="absolute top-0 left-0 h-full bg-slate-300/80 rounded-full"
                  style={{ width: `${limitPct}%` }}
                />
                {/* Actual spent fill */}
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                    isOverBudget ? 'bg-rose-500' : 'bg-primary'
                  }`}
                  style={{ width: `${spentPct}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-center gap-6 mt-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-primary inline-block" />
            <span>Actual Within Limit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-rose-500 inline-block" />
            <span>Over-Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-slate-300 inline-block" />
            <span>Allocated Limit</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
