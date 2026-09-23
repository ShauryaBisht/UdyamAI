'use client';

import React from 'react';
import ChartCard from './ChartCard';

export interface SavingsGoalItem {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
}

interface SavingsProgressChartProps {
  goals?: SavingsGoalItem[];
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

export default function SavingsProgressChart({
  goals = [],
  title = 'Savings & Capital Accumulation',
  subtitle = 'Progress toward target reserve capital and expansion funds',
  className = '',
}: SavingsProgressChartProps) {
  const safeGoals = (goals || [])
    .filter(Boolean)
    .map((g) => {
      const targetAmount = Math.max(0, Number(g?.targetAmount) || 0);
      const currentAmount = Math.max(0, Number(g?.currentAmount) || 0);
      return {
        title: String(g?.title || 'Savings Goal'),
        targetAmount,
        currentAmount,
        targetDate: g?.targetDate ? String(g.targetDate) : undefined,
      };
    });

  if (safeGoals.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Create savings goals to track milestone progress."
        className={className}
      />
    );
  }

  const totalTarget = safeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = safeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="flex flex-col gap-5">
        {/* Total progress callout */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-900 mb-2">
            <span>Overall Capital Goal Reached</span>
            <span className="font-extrabold text-sm text-primary">{totalPct}%</span>
          </div>
          <div className="w-full bg-emerald-100 h-3.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-emerald-700 mt-2 font-medium">
            <span>Saved: {formatINR(totalSaved)}</span>
            <span>Target: {formatINR(totalTarget)}</span>
          </div>
        </div>

        {/* Individual goals */}
        <div className="flex flex-col gap-3">
          {goals.map((goal, idx) => {
            const pct = goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;

            return (
              <div key={goal.title || idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800 font-bold">{goal.title}</span>
                  <span className="text-slate-500">
                    {formatINR(goal.currentAmount)} / {formatINR(goal.targetAmount)} ({pct}%)
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
