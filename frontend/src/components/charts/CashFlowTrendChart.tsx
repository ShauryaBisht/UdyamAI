'use client';

import React, { useState } from 'react';
import ChartCard from './ChartCard';

export interface CashFlowChartItem {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface CashFlowTrendChartProps {
  data?: CashFlowChartItem[];
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

export default function CashFlowTrendChart({
  data = [],
  title = 'Cash Flow Dynamics',
  subtitle = 'Monthly comparison of operating revenue inflows and expenses outflows',
  className = '',
}: CashFlowTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const safeData = (data || [])
    .filter(Boolean)
    .map((d) => {
      const inflow = Math.max(0, Number(d?.inflow) || 0);
      const outflow = Math.max(0, Number(d?.outflow) || 0);
      const net = d?.net !== undefined ? Number(d.net) : inflow - outflow;
      return {
        period: String(d?.period || 'Cycle'),
        inflow,
        outflow,
        net,
      };
    });

  if (safeData.length === 0) {
    return (
      <ChartCard
        title={title}
        subtitle={subtitle}
        empty={true}
        emptyMessage="Record cash flow transactions to visualize liquidity trends over time."
        className={className}
      />
    );
  }

  const svgWidth = 700;
  const svgHeight = 260;
  const padding = { top: 25, right: 40, bottom: 40, left: 65 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...safeData.flatMap((d) => [d.inflow, d.outflow, Math.abs(d.net)]), 1000);
  const stepX = innerWidth / safeData.length;
  const barWidth = Math.max(6, Math.min(22, stepX * 0.35));

  return (
    <ChartCard title={title} subtitle={subtitle} className={className}>
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[500px]"
          style={{ fontFeatureSettings: '"tnum"' }}
        >
          {/* Subtle gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + innerHeight * (1 - pct);
            const val = maxVal * pct;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  ₹{(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const centerX = padding.left + stepX * (idx + 0.5);
            const inflowHeight = (item.inflow / maxVal) * innerHeight;
            const outflowHeight = (item.outflow / maxVal) * innerHeight;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={item.period || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-opacity"
                opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
              >
                {/* Inflow bar (Green) */}
                <rect
                  x={centerX - barWidth - 2}
                  y={padding.top + innerHeight - inflowHeight}
                  width={barWidth}
                  height={Math.max(2, inflowHeight)}
                  rx={4}
                  fill="#10B981"
                />
                {/* Outflow bar (Red) */}
                <rect
                  x={centerX + 2}
                  y={padding.top + innerHeight - outflowHeight}
                  width={barWidth}
                  height={Math.max(2, outflowHeight)}
                  rx={4}
                  fill="#EF4444"
                />

                {/* X Axis Label */}
                <text
                  x={centerX}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-semibold"
                >
                  {item.period}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover summary */}
        {hoveredIdx !== null && (
          <div className="absolute top-2 right-4 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs flex gap-4 shadow-lg border border-slate-700">
            <div>
              <span className="text-slate-400 block">{data[hoveredIdx].period}</span>
              <span className="font-bold text-emerald-400">In: {formatINR(data[hoveredIdx].inflow)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">&nbsp;</span>
              <span className="font-bold text-rose-400">Out: {formatINR(data[hoveredIdx].outflow)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Net</span>
              <span className={`font-bold ${data[hoveredIdx].net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(data[hoveredIdx].net)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" />
          <span>Inflows (Revenue)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-rose-500 inline-block" />
          <span>Outflows (Operating Expenses)</span>
        </div>
      </div>
    </ChartCard>
  );
}
