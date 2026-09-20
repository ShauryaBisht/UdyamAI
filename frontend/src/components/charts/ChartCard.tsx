'use client';

import React from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { Loader2, BarChart2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  hasData?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function ChartCard({
  title,
  subtitle,
  action,
  loading = false,
  empty = false,
  hasData,
  emptyMessage = 'No data available for this analysis period.',
  children,
  className = '',
}: ChartCardProps) {
  // Determine if we should display empty state
  const isExplicitlyEmpty = empty || hasData === false;
  const hasContent = Boolean(children) && !isExplicitlyEmpty;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader title={title} subtitle={subtitle} action={action} />

      {loading ? (
        // Real loading state
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs font-medium">Loading visualization data…</p>
        </div>
      ) : hasContent ? (
        // Loaded with data
        <div className="mt-2">{children}</div>
      ) : (
        // Loaded with no data — honest empty state
        <div className="py-10 px-4 flex flex-col items-center justify-center text-center gap-2 border-t border-border/40 mt-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-[#1F242C] flex items-center justify-center text-slate-400 dark:text-slate-500">
            <BarChart2 className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground max-w-xs leading-relaxed">
            {emptyMessage}
          </p>
        </div>
      )}
    </Card>
  );
}