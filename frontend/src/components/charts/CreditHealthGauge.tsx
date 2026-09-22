'use client';

import React from 'react';
import ChartCard from './ChartCard';

interface CreditHealthGaugeProps {
  score?: number;
  utilizationRate?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function CreditHealthGauge({
  score = 720,
  utilizationRate = 28,
  title = 'Credit Health & Readiness Score',
  subtitle = 'Institutional lending eligibility & credit utilization assessment',
  className = '',
}: CreditHealthGaugeProps) {
  // Score ranges: 300 to 900
  const normalizedScore = Math.max(300, Math.min(900, Number(score) || 720));
  const safeUtilization = Math.max(0, Math.min(100, Number(utilizationRate) || 0));
  const scorePercent = ((normalizedScore - 300) / 600) * 100;

  let tier = 'Excellent';
  let tierColor = '#10B981';
  let tierBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (normalizedScore < 550) {
    tier = 'Poor';
    tierColor = '#EF4444';
    tierBg = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (normalizedScore < 650) {
    tier = 'Fair';
    tierColor = '#F59E0B';
    tierBg = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalizedScore < 750) {
    tier = 'Good';
    tierColor = '#3B82F6';
    tierBg = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  // SVG Semi-circle Arc parameters
  const radius = 90;
  const strokeWidth = 14;
  const cx = 150;
  const cy = 130;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100;

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Semi-circle Gauge */}
        <div className="flex flex-col items-center justify-center relative">
          <svg viewBox="0 0 300 170" className="w-64 h-auto">
            {/* Background Arc */}
            <path
              d="M 50 140 A 100 100 0 0 1 250 140"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 50 140 A 100 100 0 0 1 250 140"
              fill="none"
              stroke={tierColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
          </svg>

          {/* Center score readout */}
          <div className="absolute top-[68px] flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-800 font-financial">{normalizedScore}</span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Out of 900</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${tierBg}`}>
              {tier} Readiness
            </span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="flex flex-col gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Credit Card / Overdraft Utilization</span>
              <span className="text-[11px] text-slate-400">Target below 30% for top bank tiers</span>
            </div>
            <span
              className={`text-sm font-extrabold ${
                safeUtilization <= 30 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {safeUtilization}%
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Repayment Track Record</span>
              <span className="text-[11px] text-slate-400">On-time EMI payment consistency</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-600">100% On-Time</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
