import React from 'react';
import { render, screen } from '@testing-library/react';
import FinancialHealthCard from '@/components/dashboard/FinancialHealthCard';

describe('FinancialHealthCard Component', () => {
  it('renders default baseline financial health when no data provided', () => {
    render(<FinancialHealthCard />);
    expect(screen.getByText(/Enterprise Financial Health/i)).toBeInTheDocument();
    expect(screen.getByText(/Stable/i)).toBeInTheDocument();
  });

  it('calculates robust score for positive cashflow, high savings, and good credit', () => {
    const data = {
      cash_flow: { count: 5, total_income: 150000, total_expenses: 80000, net: 70000 },
      savings: { goals: 2, total_saved: 60000, total_target: 100000, progress_percent: 60 },
      credit: { records: 1, latest_score: 780, latest_rating: 'excellent' },
      debts: { count: 1, total_outstanding: 50000, total_principal: 100000, total_monthly_emi: 2500 },
    };

    render(<FinancialHealthCard financeData={data} />);
    expect(screen.getByText(/Robust/i)).toBeInTheDocument();
  });

  it('calculates needs attention score for negative cashflow and low credit', () => {
    const data = {
      cash_flow: { count: 3, total_income: 20000, total_expenses: 60000, net: -40000 },
      savings: { goals: 1, total_saved: 0, total_target: 50000, progress_percent: 0 },
      credit: { records: 1, latest_score: 520, latest_rating: 'poor' },
      debts: { count: 3, total_outstanding: 700000, total_principal: 800000, total_monthly_emi: 15000 },
    };

    render(<FinancialHealthCard financeData={data} />);
    expect(screen.getByText(/Needs Attention/i)).toBeInTheDocument();
  });
});
