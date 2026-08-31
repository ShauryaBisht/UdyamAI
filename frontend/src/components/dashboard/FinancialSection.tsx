'use client';

import ChartCard from '@/components/charts/ChartCard';

const financialData = {
  initialInvestment: 800000,
  monthlyRevenue: 120000,
  monthlyExpenses: 75000,
  monthlyProfit: 45000,
};

const fundingData = [
  { label: 'Own Capital', amount: 200000, percentage: 25 },
  { label: 'Bank Loan', amount: 500000, percentage: 62.5 },
  { label: 'Government Subsidy', amount: 100000, percentage: 12.5 },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function FinancialMetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function FinancialSection() {
  return (
    <div className="flex flex-col gap-6">

      {/* Financial summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricCard
          label="Initial Investment"
          value={financialData.initialInvestment}
        />

        <FinancialMetricCard
          label="Monthly Revenue"
          value={financialData.monthlyRevenue}
        />

        <FinancialMetricCard
          label="Monthly Expenses"
          value={financialData.monthlyExpenses}
        />

        <FinancialMetricCard
          label="Monthly Profit"
          value={financialData.monthlyProfit}
        />
      </div>

      {/* Funding visualization */}
      <ChartCard
        title="Funding Breakdown"
        subtitle="Estimated sources of initial business funding"
      >
        <div className="flex flex-col gap-5">
          {fundingData.map((item) => (
            <div key={item.label}>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>

                <span className="text-sm text-gray-500">
                  {formatCurrency(item.amount)}
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${item.percentage}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-xs text-gray-400">
                {item.percentage}% of total funding
              </p>

            </div>
          ))}
        </div>
      </ChartCard>

    </div>
  );
}