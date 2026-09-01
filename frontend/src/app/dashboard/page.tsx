'use client';

import React, { useState } from 'react';
import Header from '@/components/ui/Header';
import DashboardNav, { DashboardSection } from '@/components/dashboard/DashboardNav';
import FinancialSection from '@/components/dashboard/FinancialSection';
import MarketSection from '@/components/dashboard/MarketSection';
import CompetitionSection from '@/components/dashboard/CompetitionSection';
import SchemeSection from '@/components/dashboard/SchemeSection';
import MapContainer from '@/components/maps/MapContainer';

// ---- Mock data (temporary — will move to mocks/dashboard/ later) ----
const mockAnalysisResult = {
  feasibility: {
    overall_score: 74,
    label: 'Moderately Feasible',
  },
  scores: {
    market: 82,
    financial: 68,
    competition: 71,
  },
  risk: {
    level: 'Medium', // 'Low' | 'Medium' | 'High'
  },
};

// ---- Helpers ----
function getScoreColor(score: number) {
  if (score >= 75) return 'text-green-600 bg-green-50';
  if (score >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function getRiskColor(level: string) {
  switch (level) {
    case 'Low':
      return 'text-green-700 bg-green-100';
    case 'Medium':
      return 'text-amber-700 bg-amber-100';
    case 'High':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

// ---- Reusable-ish inline components (will extract later) ----
function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold rounded-md px-2 ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-sm text-gray-400">/100</span>
      </div>
    </div>
  );
}

function ComingSoon({ section }: { section: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
      <p className="text-lg font-medium">{section} — coming soon</p>
      <p className="text-sm mt-1">This section is still being built.</p>
    </div>
  );
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const { feasibility, scores, risk } = mockAnalysisResult;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="p-6 max-w-5xl mx-auto flex flex-col gap-2 w-full flex-1">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-slate-900">Analysis Result</h1>
          <p className="text-gray-500 mt-1">Overview of your business feasibility</p>
        </div>

        <DashboardNav activeSection={activeSection} onSectionChange={setActiveSection} />

        {activeSection === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Overall feasibility banner */}
            <div className="rounded-xl border border-gray-200 p-6 flex items-center justify-between bg-white">
              <div>
                <span className="text-sm font-medium text-gray-500">Overall Feasibility</span>
                <div className="text-4xl font-bold mt-1">{feasibility.overall_score}/100</div>
                <span className="text-gray-600">{feasibility.label}</span>
              </div>
              <div className={`px-4 py-2 rounded-lg font-semibold ${getRiskColor(risk.level)}`}>
                {risk.level} Risk
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ScoreCard label="Market Score" score={scores.market} />
              <ScoreCard label="Financial Score" score={scores.financial} />
              <ScoreCard label="Competition Score" score={scores.competition} />
            </div>
          </div>
        )}

        {activeSection === 'financial' && <FinancialSection />}
        {activeSection === 'market' && <MarketSection />}
        {activeSection === 'competition' && <CompetitionSection />}
        {activeSection === 'map' && <MapContainer title="Location & Nearby Infrastructure" />}
        {activeSection === 'schemes' && <SchemeSection />}
        {activeSection === 'risks' && <ComingSoon section="Risk Dashboard" />}
        {activeSection === 'report' && <ComingSoon section="AI Report" />}
      </main>
    </div>
  );
}