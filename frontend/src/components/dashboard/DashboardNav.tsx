'use client';

import React from 'react';
import { useTranslation } from '@/stores/languageStore';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Users,
  MapPin,
  FileSpreadsheet,
  ShieldAlert,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export type DashboardSection =
  | 'overview'
  | 'financial'
  | 'market'
  | 'competition'
  | 'map'
  | 'schemes'
  | 'risks'
  | 'report';

interface SectionConfig {
  id: DashboardSection;
  key: string;
  icon: LucideIcon;
}

const SECTION_KEYS: SectionConfig[] = [
  { id: 'overview', key: 'dash.nav.overview', icon: LayoutDashboard },
  { id: 'financial', key: 'dash.nav.financial', icon: Wallet },
  { id: 'market', key: 'dash.nav.market', icon: TrendingUp },
  { id: 'competition', key: 'dash.nav.competition', icon: Users },
  { id: 'map', key: 'dash.nav.map', icon: MapPin },
  { id: 'schemes', key: 'dash.nav.schemes', icon: FileSpreadsheet },
  { id: 'risks', key: 'dash.nav.risks', icon: ShieldAlert },
  { id: 'report', key: 'dash.nav.report', icon: FileText },
];

interface DashboardNavProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export default function DashboardNav({ activeSection, onSectionChange }: DashboardNavProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop / Tablet Horizontal Pill Navigation */}
      <nav className="hidden md:block overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-[#1C2128] rounded-full border border-slate-200 dark:border-[#2B313C]">
          {SECTION_KEYS.map((section) => {
            const isActive = section.id === activeSection;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-white dark:bg-[#272D37] text-primary dark:text-[#34D399] shadow-sm font-bold scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10 hover:scale-[1.01]'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'text-primary dark:text-[#34D399] scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{t(section.key)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Top Scrollable Quick Bar */}
      <nav className="md:hidden overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#1C2128] rounded-full border border-slate-200 dark:border-[#2B313C]">
          {SECTION_KEYS.map((section) => {
            const isActive = section.id === activeSection;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-white dark:bg-[#272D37] text-primary dark:text-[#34D399] shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'scale-110' : ''}`} />
                <span>{t(section.key)}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#161B22]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#2B313C] px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {SECTION_KEYS.slice(0, 5).map((section) => {
            const isActive = section.id === activeSection;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                  isActive ? 'text-primary dark:text-[#34D399] font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] mt-0.5">{t(section.key)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
