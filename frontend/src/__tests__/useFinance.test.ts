import { renderHook, act } from '@testing-library/react';
import { useFinance } from '@/hooks/useFinance';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('useFinance Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default profileId and empty states', () => {
    const { result } = renderHook(() => useFinance('test-profile-123'));
    expect(result.current.profileId).toBe('test-profile-123');
    expect(result.current.expenses).toEqual([]);
    expect(result.current.expensesLoading).toBe(false);
  });

  it('fetches expenses and summary successfully', async () => {
    const mockExpenses = [
      { id: '1', profile_id: 'test-profile-123', category: 'rent', amount: 5000, date: '2026-09-01', is_recurring: true, created_at: '2026-09-01' },
    ];
    const mockSummary = { total_expenses: 5000, by_category: { rent: 5000 }, recurring_total: 5000, count: 1 };

    mockedApi.getExpenses.mockResolvedValueOnce(mockExpenses);
    mockedApi.getExpenseSummary.mockResolvedValueOnce(mockSummary);

    const { result } = renderHook(() => useFinance('test-profile-123'));

    await act(async () => {
      await result.current.fetchExpenses();
    });

    expect(result.current.expenses).toEqual(mockExpenses);
    expect(result.current.expenseSummary).toEqual(mockSummary);
    expect(result.current.expensesLoading).toBe(false);
  });

  it('performs finance calculation with repayment schedule and scenarios', async () => {
    const mockCalcResult = {
      status: 'success',
      available_capital: 500000,
      required_contribution: 500000,
      shortfall: 0,
      repayment_schedule: [
        {
          period_number: 1,
          opening_balance: 300000,
          payment_amount: 6000,
          principal_amount: 4000,
          interest_amount: 2000,
          closing_balance: 296000,
          remaining_principal: 296000,
          is_moratorium: false,
        },
      ],
      financial_scenarios: [
        {
          scenario_type: 'expected_case',
          sufficient_assumptions_exist: true,
          revenue: 100000,
          operating_costs: 60000,
          surplus: 40000,
        },
      ],
    };

    mockedApi.calculateFinance.mockResolvedValueOnce(mockCalcResult);

    const { result } = renderHook(() => useFinance('test-profile-123'));

    await act(async () => {
      await result.current.calculate({
        available_capital: 500000,
        desired_project_cost: 800000,
      });
    });

    expect(result.current.calculationResult).toEqual(mockCalcResult);
    expect(result.current.calculationLoading).toBe(false);
  });
});
