'use client';

import React from 'react';

interface MarketStatProps {
  label: string;
  value: string;
  description?: string;
}

function MarketStat({ label, value, description }: MarketStatProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 bg-white">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-gray-900 mt-2">
        {value}
      </p>

      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

export default function MarketSection() {
  const marketData = {
    marketSize: '₹12.5 Cr',
    growthRate: '14.2%',
    demandLevel: 'High',
    targetCustomers: '25,000+',
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Market statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MarketStat
          label="Estimated Market Size"
          value={marketData.marketSize}
          description="Potential annual market"
        />

        <MarketStat
          label="Market Growth Rate"
          value={marketData.growthRate}
          description="Expected yearly growth"
        />

        <MarketStat
          label="Demand Level"
          value={marketData.demandLevel}
          description="Based on market indicators"
        />

        <MarketStat
          label="Target Customers"
          value={marketData.targetCustomers}
          description="Estimated potential customers"
        />
      </div>

      {/* Market opportunity */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">
          Market Opportunity
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Overall assessment of market potential
        </p>

        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Opportunity Score
            </span>

            <span className="text-sm font-semibold text-green-600">
              82 / 100
            </span>
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: '82%' }}
            />
          </div>
        </div>
      </div>

      {/* Key insights */}
      <div className="rounded-xl border border-gray-200 p-6 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">
          Key Market Insights
        </h3>

        <div className="mt-4 flex flex-col gap-3">
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-700">
              Strong demand detected in the selected business category.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-700">
              The market shows positive growth potential over the next few years.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-700">
              Customer demand appears sufficient to support new businesses.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}