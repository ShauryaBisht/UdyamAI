'use client';

import ChartCard from '@/components/charts/ChartCard';
import AmortizationChart from '@/components/charts/AmortizationChart';
import ScenarioComparisonChart from '@/components/charts/ScenarioComparisonChart';

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
    <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-5 shadow-subtle hover:border-primary/30 transition-all">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>

      <p className="mt-2 text-2xl sm:text-3xl font-extrabold font-financial tracking-tight text-foreground">
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
          ? [{ label: 'Own Capital', amount: ownCapital, percentage: Math.round((ownCapital / totalFund) * 100), color: 'bg-primary' }]
          : []),
        ...(loanRequired != null
          ? [{ label: 'Bank Loan Required', amount: loanRequired, percentage: Math.round((loanRequired / totalFund) * 100), color: 'bg-indigo-500' }]
          : []),
        ...(subsidyEstimated != null
          ? [{ label: 'Government Subsidy (Est.)', amount: subsidyEstimated, percentage: Math.round((subsidyEstimated / totalFund) * 100), color: 'bg-cyan-500' }]
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
        <div className="rounded-2xl border border-border bg-white dark:bg-[#161B22] p-6 shadow-subtle">
          <p className="text-sm font-bold text-foreground mb-4 tracking-tight">Loan & Repayment Metrics</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {interestRate != null && (
              <div className="border-l-2 border-primary/30 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interest Rate</p>
                <p className="text-xl font-bold font-financial text-foreground mt-1">{Number(interestRate).toFixed(1)}% p.a.</p>
              </div>
            )}
            {tenureMonths != null && (
              <div className="border-l-2 border-primary/30 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Tenure</p>
                <p className="text-xl font-bold font-financial text-foreground mt-1">{Number(tenureMonths)} months</p>
              </div>
            )}
            {repaymentCapacity != null && (
              <div className="border-l-2 border-primary/30 pl-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repayment DSCR</p>
                <p className="text-xl font-bold font-financial text-foreground mt-1">{Number(repaymentCapacity).toFixed(2)}x</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Financial Guidance (when data is sparse or guidance available) */}
      {(financialAdviceList.length > 0) && (
        <div className="rounded-2xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              AI Financial Guidance
            </p>
            {aiAdvice.confidence && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                aiAdvice.confidence === 'high' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : aiAdvice.confidence === 'medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-[#1F242C] text-muted-foreground border-slate-200 dark:border-[#2B313C]'
              }`}>
                {aiAdvice.confidence.toUpperCase()} CONFIDENCE
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {financialAdviceList.map((advice: string, i: number) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{advice}</span>
              </li>
            ))}
          </ul>
          {aiAdvice.sources && aiAdvice.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-primary/10 dark:border-primary/20 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">Sources:</span>
              {aiAdvice.sources.map((s: any, idx: number) => (
                <span key={idx} className="bg-white dark:bg-[#1F242C] dark:text-slate-200 px-2 py-0.5 rounded border border-primary/15 font-mono text-[11px]">
                  {s.claim || s.source_type || `Source #${idx + 1}`}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Funding visualization */}
      <ChartCard
        title="Capital & Subsidy Structure"
        subtitle="Dynamic breakdown calculated by UdyamAI Finance Engine"
      >
        <div className="flex flex-col gap-6 pt-2">
          {fundingData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Financial breakdown will appear once the analysis pipeline computes project financing.
            </p>
          ) : (
            fundingData.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {item.label}
                  </span>

                  <span className="text-sm font-bold font-financial text-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1F242C]">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{
                      width: `${Math.min(100, Math.max(5, item.percentage))}%`,
                    }}
                  />
                </div>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {item.percentage}% of total funding structure
                </p>
              </div>
            ))
          )}
        </div>
      </ChartCard>

      {/* Real Loan Amortization Schedule (only rendered when real repayment data exists) */}
      {fin.repayment_schedule && fin.repayment_schedule.length > 0 && (
        <AmortizationChart schedule={fin.repayment_schedule} />
      )}

      {/* Financial Scenario Sensitivity (only rendered when real scenario data exists) */}
      {fin.financial_scenarios && fin.financial_scenarios.length > 0 && (
        <ScenarioComparisonChart scenarios={fin.financial_scenarios} />
      )}
    </div>
  );
}