'use client';

import React from 'react';
import ChartCard from './ChartCard';

export interface ExpenseCategoryItem {
  category: string;
  amount: number;
  count?: number;
}

interface ExpenseCategoryChartProps {
  categories?: ExpenseCategoryItem[];
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

const PALETTE = [
  '#159A68',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#84CC16',
  '#64748B',
];

export default function ExpenseCategoryChart({
  categories = [],
  title = 'Expense Distribution by Category',
  subtitle = 'Breakdown of operational spend across business activities',
  className = '',
}: ExpenseCategoryChartProps) {
  const safeCategories = (categories || [])
    .filter(Boolean)
    .map((c) => ({
      category: String(c?.category || 'Operational'),
      amount: Math.max(0, Number(c?.amount) || 0),
      count: c?.count !== undefined ? Number(c.count) : undefined,
    }))
    .filter((c) => c.amount > 0);

  if (safeCategories.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Add expense records to view category-wise spending distribution."
        className={className}
      />
    );
  }

  const total = safeCategories.reduce((sum, c) => sum + c.amount, 0);
  const sorted = [...safeCategories].sort((a, b) => b.amount - a.amount);

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="flex flex-col gap-3.5">
        {sorted.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const pct = total > 0 ? (item.amount / total) * 100 : 0;

          return (
            <div key={item.category || idx} className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize font-bold">{item.category.replace(/_/g, ' ')}</span>
                  {item.count !== undefined && (
                    <span className="text-[10px] text-slate-400 font-normal">({item.count} bills)</span>
                  )}
                </div>
                <div className="font-extrabold text-slate-700">
                  {formatINR(item.amount)}{' '}
                  <span className="text-[10px] text-slate-400 font-medium">({pct.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 border border-slate-200/70 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
