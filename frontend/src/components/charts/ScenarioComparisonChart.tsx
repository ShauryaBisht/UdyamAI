'use client';

import React from 'react';
import type { FinancialScenarioResponse } from '@/types/finance';
import ChartCard from './ChartCard';

interface ScenarioComparisonChartProps {
  scenarios?: FinancialScenarioResponse[];
  title?: string;
  subtitle?: string;
  className?: string;
}

function formatINR(val: number | null | undefined): string {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export default function ScenarioComparisonChart({
  scenarios = [],
  title = 'Scenario Sensitivity & Stress Testing',
  subtitle = 'Worst-case vs. Expected vs. Best-case performance computed by UdyamAI Finance Engine',
  className = '',
}: ScenarioComparisonChartProps) {
  // Only render if scenarios are genuinely populated
  if (!scenarios || scenarios.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Scenario modeling requires revenue and operating cost assumptions."
        className={className}
      />
    );
  }

  const scenarioMeta = [
    { key: 'worst_case', label: 'Worst Case', color: 'bg-rose-500', barColor: '#F43F5E', textColor: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50', bg: 'bg-rose-50/50 dark:bg-rose-950/20' },
    { key: 'expected_case', label: 'Expected Baseline', color: 'bg-primary', barColor: '#0284C7', textColor: 'text-primary dark:text-emerald-400', border: 'border-primary/20 dark:border-primary/30', bg: 'bg-primary/5 dark:bg-primary/10' },
    { key: 'best_case', label: 'Best Case', color: 'bg-emerald-500', barColor: '#10B981', textColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
  ];

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      className={className}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {scenarioMeta.map((meta) => {
          const scenario = scenarios.find((s) => s.scenario_type === meta.key);
          if (!scenario) return null;

          const revenue = scenario.revenue ?? scenario.monthly_revenue ?? 0;
          const costs = scenario.operating_costs ?? scenario.monthly_expenses ?? 0;
          const surplus = scenario.surplus ?? scenario.monthly_profit ?? (revenue - costs);
          const dscr = scenario.repayment_coverage ?? null;
          const cashSurplus = scenario.cash_surplus ?? null;

          return (
            <div
              key={meta.key}
              className={`rounded-2xl border ${meta.border} ${meta.bg} p-5 flex flex-col justify-between shadow-subtle`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-[#2B313C]">
                    <span className="text-muted-foreground">Monthly Revenue</span>
                    <span className="font-bold text-foreground">{formatINR(revenue)}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-[#2B313C]">
                    <span className="text-muted-foreground">Operating Costs</span>
                    <span className="font-bold text-foreground">{formatINR(costs)}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-[#2B313C]">
                    <span className="text-muted-foreground">Operating Surplus</span>
                    <span className={`font-extrabold ${meta.textColor}`}>{formatINR(surplus)}</span>
                  </div>

                  {cashSurplus != null && (
                    <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-[#2B313C]">
                      <span className="text-muted-foreground">Net Cash Surplus</span>
                      <span className={`font-extrabold ${cashSurplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatINR(cashSurplus)}
                      </span>
                    </div>
                  )}

                  {dscr != null && (
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">DSCR Coverage</span>
                      <span className={`font-bold ${dscr >= 1.5 ? 'text-emerald-600 dark:text-emerald-400' : dscr >= 1.0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {Number(dscr).toFixed(2)}x
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {scenario.marked_assumptions?.revenue_basis && (
                <p className="mt-4 pt-3 border-t border-slate-200/50 dark:border-[#2B313C] text-[11px] text-muted-foreground italic">
                  {scenario.marked_assumptions.revenue_basis}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
