'use client';

import ChartCard from '@/components/charts/ChartCard';

interface FinancialSectionProps {
  data?: any;
}

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
  isCurrency = true,
  unit,
}: {
  label: string;
  value: number | null;
  isCurrency?: boolean;
  unit?: string;
}) {
  return (
    <div className="rounded-card border border-primary/10 bg-white p-5 shadow-card">
      <p className="text-sm font-medium text-foreground/60">{label}</p>

      <p className="mt-2 text-metric-lg text-foreground">
        {value != null
          ? isCurrency
            ? formatCurrency(value)
            : unit
              ? `${value} ${unit}`
              : `${value}`
          : '—'}
      </p>
    </div>
  );
}

export default function FinancialSection({ data }: FinancialSectionProps) {
  const fin = data?.financial || {};
  const aiAdvice = data?.ai_advice || {};
  const financialAdviceList: string[] = aiAdvice.financial_advice || [];

  // Map backend field names to display values (use all available fields)
  const projectCost = fin.project_cost
    ?? fin.feasible_project_cost
    ?? fin.desired_project_cost
    ?? null;
  const ownCapital = fin.own_capital ?? fin.available_capital ?? null;
  const loanRequired = fin.loan_required
    ?? fin.recommended_loan
    ?? fin.calculated_loan
    ?? (projectCost != null && ownCapital != null ? Math.max(0, projectCost - ownCapital) : null);
  const subsidyEstimated = fin.subsidy_estimated ?? fin.estimated_subsidy ?? null;

  const monthlyRevenue = fin.monthly_revenue ?? fin.estimated_monthly_revenue ?? null;
  const monthlyExpenses = fin.monthly_expenses
    ?? fin.monthly_operating_cost
    ?? fin.estimated_monthly_expenses
    ?? null;
  const monthlyProfit = fin.monthly_net_profit
    ?? fin.monthly_profit
    ?? (monthlyRevenue != null && monthlyExpenses != null ? monthlyRevenue - monthlyExpenses : null);

  const breakEvenMonths = fin.break_even_months ?? null;
  const interestRate = fin.interest_rate ?? null;
  const tenureMonths = fin.tenure_months ?? null;
  const monthlyEmi = fin.monthly_emi ?? null;
  const repaymentCapacity = fin.repayment_capacity ?? null;

  // Calculate funding breakdown from real values only
  const hasFundingData = ownCapital != null || loanRequired != null || subsidyEstimated != null;
  const totalFund = ((ownCapital || 0) + (loanRequired || 0) + (subsidyEstimated || 0)) || 1;

  const fundingData = hasFundingData
    ? [
        ...(ownCapital != null
          ? [{ label: 'Own Capital', amount: ownCapital, percentage: Math.round((ownCapital / totalFund) * 100) }]
          : []),
        ...(loanRequired != null
          ? [{ label: 'Bank Loan Required', amount: loanRequired, percentage: Math.round((loanRequired / totalFund) * 100) }]
          : []),
        ...(subsidyEstimated != null
          ? [{ label: 'Government Subsidy (Est.)', amount: subsidyEstimated, percentage: Math.round((subsidyEstimated / totalFund) * 100) }]
          : []),
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Financial summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricCard
          label="Project Cost"
          value={projectCost}
        />

        <FinancialMetricCard
          label="Monthly Revenue (Est.)"
          value={monthlyRevenue}
        />

        <FinancialMetricCard
          label="Monthly Operating Cost"
          value={monthlyExpenses}
        />

        <FinancialMetricCard
          label="Monthly Net Profit"
          value={monthlyProfit}
        />
      </div>

      {/* Secondary financial metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricCard
          label="Loan Required"
          value={loanRequired}
        />

        <FinancialMetricCard
          label="Government Subsidy (Est.)"
          value={subsidyEstimated}
        />

        <FinancialMetricCard
          label="Monthly EMI"
          value={monthlyEmi}
        />

        <FinancialMetricCard
          label="Break-even Period"
          value={breakEvenMonths != null ? Number(breakEvenMonths) : null}
          isCurrency={false}
          unit="Months"
        />
      </div>

      {/* Loan & Repayment details */}
      {(interestRate != null || tenureMonths != null || repaymentCapacity != null) && (
        <div className="rounded-card border border-primary/10 bg-white p-5 shadow-card">
          <p className="text-sm font-bold text-foreground mb-3">Loan & Repayment Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {interestRate != null && (
              <div>
                <p className="text-xs font-medium text-foreground/60">Interest Rate</p>
                <p className="text-lg font-bold text-foreground">{Number(interestRate).toFixed(1)}% p.a.</p>
              </div>
            )}
            {tenureMonths != null && (
              <div>
                <p className="text-xs font-medium text-foreground/60">Loan Tenure</p>
                <p className="text-lg font-bold text-foreground">{Number(tenureMonths)} months</p>
              </div>
            )}
            {repaymentCapacity != null && (
              <div>
                <p className="text-xs font-medium text-foreground/60">Repayment Capacity (DSCR)</p>
                <p className="text-lg font-bold text-foreground">{Number(repaymentCapacity).toFixed(2)}x</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Financial Guidance (when data is sparse) */}
      {(projectCost == null && monthlyRevenue == null && financialAdviceList.length > 0) && (
        <div className="rounded-card border border-primary/15 bg-primary/5 p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            AI Financial Guidance
          </p>
          <ul className="space-y-1.5">
            {financialAdviceList.map((advice: string, i: number) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{advice}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Funding visualization */}
      <ChartCard
        title="Capital & Subsidy Structure"
        subtitle="Dynamic breakdown calculated by UdyamAI Finance Engine"
      >
        <div className="flex flex-col gap-5">
          {fundingData.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Financial breakdown will appear once the analysis pipeline computes project financing.
            </p>
          ) : (
            fundingData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground/70">
                    {item.label}
                  </span>

                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, item.percentage))}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-foreground/50">
                  {item.percentage}% of total funding structure
                </p>
              </div>
            ))
          )}
        </div>
      </ChartCard>
    </div>
  );
}