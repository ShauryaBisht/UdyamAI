import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardNav, { type DashboardSection } from '@/components/dashboard/DashboardNav';

describe('DashboardNav Component', () => {
  it('renders navigation tabs and highlights active section', () => {
    const handleSectionChange = jest.fn();
    render(
      <DashboardNav
        activeSection="financial"
        onSectionChange={handleSectionChange}
      />
    );

    const financialButtons = screen.getAllByText(/Financial/i);
    expect(financialButtons.length).toBeGreaterThan(0);
  });

  it('triggers onSectionChange callback when a tab is clicked', () => {
    const handleSectionChange = jest.fn();
    render(
      <DashboardNav
        activeSection="overview"
        onSectionChange={handleSectionChange}
      />
    );

    const marketButtons = screen.getAllByText(/Market/i);
    fireEvent.click(marketButtons[0]);
    expect(handleSectionChange).toHaveBeenCalledWith('market');
  });
});
