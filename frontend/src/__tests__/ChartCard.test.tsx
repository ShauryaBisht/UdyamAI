import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartCard from '@/components/charts/ChartCard';

describe('ChartCard Component', () => {
  it('renders loading state when loading prop is true', () => {
    render(<ChartCard title="Revenue Trend" loading={true} />);
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    expect(screen.getByText(/Loading visualization data/i)).toBeInTheDocument();
    expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();
  });

  it('renders honest empty state when loaded without children/data', () => {
    render(
      <ChartCard
        title="Amortization Schedule"
        subtitle="Repayment schedule"
        empty={true}
        emptyMessage="No repayment data available"
      />
    );
    expect(screen.getByText('Amortization Schedule')).toBeInTheDocument();
    expect(screen.getByText('Repayment schedule')).toBeInTheDocument();
    expect(screen.getByText('No repayment data available')).toBeInTheDocument();
  });

  it('renders chart content normally when children and data are present', () => {
    render(
      <ChartCard title="Funding Breakdown">
        <div data-testid="chart-content">
          <span>Own Capital: 50%</span>
        </div>
      </ChartCard>
    );
    expect(screen.getByText('Funding Breakdown')).toBeInTheDocument();
    expect(screen.getByTestId('chart-content')).toBeInTheDocument();
    expect(screen.getByText('Own Capital: 50%')).toBeInTheDocument();
    expect(screen.queryByText(/Loading visualization data/i)).not.toBeInTheDocument();
  });
});
