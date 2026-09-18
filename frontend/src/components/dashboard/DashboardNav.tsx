'use client';

import React from 'react';
import { useLanguageStore } from '@/stores/languageStore';

export type DashboardSection =
  | 'overview'
  | 'financial'
  | 'market'
  | 'competition'
  | 'map'
  | 'schemes'
  | 'risks'
  | 'report';

const SECTION_KEYS: { id: DashboardSection; key: string }[] = [
  { id: 'overview', key: 'dash.nav.overview' },
  { id: 'financial', key: 'dash.nav.financial' },
  { id: 'market', key: 'dash.nav.market' },
  { id: 'competition', key: 'dash.nav.competition' },
  { id: 'map', key: 'dash.nav.map' },
  { id: 'schemes', key: 'dash.nav.schemes' },
  { id: 'risks', key: 'dash.nav.risks' },
  { id: 'report', key: 'dash.nav.report' },
];

interface DashboardNavProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export default function DashboardNav({ activeSection, onSectionChange }: DashboardNavProps) {
  const t = useLanguageStore((s) => s.t);

  return (
  <nav className="mb-6 overflow-x-auto border-b border-primary/15">
    <div className="flex min-w-max gap-1">
      {SECTION_KEYS.map((section) => {
        const isActive = section.id === activeSection;

        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/60 hover:border-primary/20 hover:text-foreground'
            }`}
          >
            {t(section.key)}
          </button>
        );
      })}
    </div>
  </nav>
);
}
