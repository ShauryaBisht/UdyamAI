'use client';

import React from 'react';

export type DashboardSection =
  | 'overview'
  | 'financial'
  | 'market'
  | 'competition'
  | 'map'
  | 'schemes'
  | 'risks'
  | 'report';

const SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'financial', label: 'Financial' },
  { id: 'market', label: 'Market' },
  { id: 'competition', label: 'Competition' },
  { id: 'map', label: 'Map' },
  { id: 'schemes', label: 'Schemes' },
  { id: 'risks', label: 'Risks' },
  { id: 'report', label: 'AI Report' },
];

interface DashboardNavProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export default function DashboardNav({ activeSection, onSectionChange }: DashboardNavProps) {
  return (
    <nav className="border-b border-gray-200 mb-6 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {SECTIONS.map((section) => {
          const isActive = section.id === activeSection;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}