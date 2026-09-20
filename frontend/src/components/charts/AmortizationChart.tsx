'use client';

import React, { useState } from 'react';
import type { RepaymentScheduleItemResponse } from '@/types/finance';
import ChartCard from './ChartCard';

interface AmortizationChartProps {
  schedule?: RepaymentScheduleItemResponse[];
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

export default function AmortizationChart({
  schedule = [],
  title = 'Loan Amortization & Repayment Schedule',
  subtitle = 'Real declining loan balance & stacked principal vs. interest breakdown',
  className = '',
}: AmortizationChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!schedule || schedule.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Repayment schedule will appear once loan amount and tenure are calculated."
        className={className}
      />
    );
  }

  // Downsample to at most 36-60 display bars for clear visualization if tenure is long
  const displayItems = schedule.length > 48
    ? schedule.filter((_, idx) => idx % Math.ceil(schedule.length / 36) === 0 || idx === schedule.length - 1)
    : schedule;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 60, bottom: 45, left: 65 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Max values for scales
  const maxBalance = Math.max(...schedule.map((s) => s.opening_balance), 1);
  const maxPayment = Math.max(...schedule.map((s) => (s.principal_amount || 0) + (s.interest_amount || 0)), 1);

  const barWidth = Math.max(4, Math.min(22, (innerWidth / displayItems.length) * 0.65));

  // Balance Line coordinates
  const points = displayItems.map((item, idx) => {
    const x = padding.left + (idx / Math.max(1, displayItems.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (item.closing_balance / maxBalance) * innerHeight;
    return { x, y, item, idx };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`, '')
    : '';

  const hoveredItem = hoveredIdx !== null ? displayItems[hoveredIdx] : null;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Principal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500" />
            <span className="text-muted-foreground">Interest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-emerald-500" />
            <span className="text-muted-foreground">Balance Line</span>
          </div>
        </div>
      }
      className={className}
    >
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[600px] select-none"
        >
          <defs>
            {/* Moratorium Hatch Pattern */}
            <pattern
              id="moratoriumHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94A3B8" strokeWidth="2.5" />
            </pattern>
            {/* Line Glow */}
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const y = padding.top + innerHeight * (1 - tick);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700/80"
                  strokeDasharray="4 4"
                />
                {/* Left Y-axis (Monthly Payment) */}
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                >
                  {formatINR(maxPayment * tick)}
                </text>
                {/* Right Y-axis (Declining Balance) */}
                <text
                  x={svgWidth - padding.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono"
                >
                  {formatINR(maxBalance * tick)}
                </text>
              </g>
            );
          })}

          {/* Stacked Payment Bars */}
          {displayItems.map((item, idx) => {
            const cx = padding.left + (idx / Math.max(1, displayItems.length - 1)) * innerWidth;
            const x = cx - barWidth / 2;

            const principalHeight = ((item.principal_amount || 0) / maxPayment) * innerHeight;
            const interestHeight = ((item.interest_amount || 0) / maxPayment) * innerHeight;
            const totalHeight = principalHeight + interestHeight;

            const principalY = padding.top + innerHeight - principalHeight;
            const interestY = principalY - interestHeight;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={`period-${item.period_number}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Moratorium visual background */}
                {item.is_moratorium && (
                  <rect
                    x={x - 2}
                    y={padding.top}
                    width={barWidth + 4}
                    height={innerHeight}
                    fill="url(#moratoriumHatch)"
                    opacity={0.35}
                    rx="3"
                  />
                )}

                {/* Principal Bar (Bottom) */}
                {principalHeight > 0 && (
                  <rect
                    x={x}
                    y={principalY}
                    width={barWidth}
                    height={principalHeight}
                    fill="#0284C7"
                    className="transition-all"
                    opacity={isHovered ? 1 : 0.85}
                    rx="1.5"
                  />
                )}

                {/* Interest Bar (Top) */}
                {interestHeight > 0 && (
                  <rect
                    x={x}
                    y={interestY}
                    width={barWidth}
                    height={interestHeight}
                    fill="#F59E0B"
                    className="transition-all"
                    opacity={isHovered ? 1 : 0.85}
                    rx="1.5"
                  />
                )}

                {/* Hover trigger invisible rect */}
                <rect
                  x={x - 4}
                  y={padding.top}
                  width={barWidth + 8}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* X-axis Period label */}
                {(idx === 0 || idx === displayItems.length - 1 || idx % Math.ceil(displayItems.length / 6) === 0) && (
                  <text
                    x={cx}
                    y={padding.top + innerHeight + 18}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 text-[10px] font-medium"
                  >
                    M{item.period_number}
                  </text>
                )}
              </g>
            );
          })}

          {/* Declining Balance Line */}
          {pathD && (
            <>
              <path
                d={pathD}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === i ? 5 : 2}
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth={hoveredIdx === i ? 2 : 1}
                />
              ))}
            </>
          )}

          {/* Hover Tooltip Overlay in SVG */}
          {hoveredItem && hoveredIdx !== null && (
            <g
              transform={`translate(${Math.min(
                svgWidth - 210,
                Math.max(10, points[hoveredIdx].x - 100)
              )}, ${Math.max(10, points[hoveredIdx].y - 85)})`}
              className="pointer-events-none"
            >
              <rect
                width="200"
                height="76"
                rx="8"
                fill="#0F172A"
                opacity="0.95"
                className="shadow-lg"
              />
              <text x="10" y="18" fill="#F8FAFC" className="text-[11px] font-bold">
                Month {hoveredItem.period_number} {hoveredItem.is_moratorium ? '(Moratorium)' : ''}
              </text>
              <text x="10" y="34" fill="#93C5FD" className="text-[10px]">
                Principal: {formatINR(hoveredItem.principal_amount || 0)}
              </text>
              <text x="10" y="48" fill="#FCD34D" className="text-[10px]">
                Interest: {formatINR(hoveredItem.interest_amount || 0)}
              </text>
              <text x="10" y="64" fill="#6EE7B7" className="text-[10px] font-semibold">
                Balance: {formatINR(hoveredItem.closing_balance || 0)}
              </text>
            </g>
          )}
        </svg>

        {/* X Axis Label */}
        <p className="text-center text-xs font-semibold text-muted-foreground mt-2">
          Repayment Period (Months)
        </p>
      </div>
    </ChartCard>
  );
}
