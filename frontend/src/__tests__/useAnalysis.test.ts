import { renderHook, act } from '@testing-library/react';
import { useAnalysis } from '@/hooks/useAnalysis';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('useAnalysis Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with idle status and empty data', () => {
    const { result } = renderHook(() => useAnalysis());
    expect(result.current.analysisId).toBeNull();
    expect(result.current.analysisData).toBeNull();
    expect(result.current.status).toBe('idle');
    expect(result.current.loading).toBe(false);
  });

  it('triggers startAnalysis and sets analysisId', async () => {
    mockedApi.startAnalysis.mockResolvedValueOnce({
      analysis_id: 'test-analysis-999',
      status: 'pending',
    });

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.start({
        village_id: 'v-1',
        business_category_id: 'b-1',
        available_capital: 500000,
        desired_project_cost: 800000,
      });
    });

    expect(result.current.analysisId).toBe('test-analysis-999');
    expect(result.current.status).toBe('running');
  });

  it('fetches consolidated analysis data and updates completed status', async () => {
    const mockConsolidated = {
      analysis_id: 'test-analysis-999',
      status: 'completed',
      financial: { feasible_project_cost: 800000, available_capital: 500000 },
      market: { market_score: 82 },
      competition: { competition_score: 75 },
      feasibility: { overall_score: 80 },
    };

    mockedApi.getConsolidatedAnalysis.mockResolvedValueOnce(mockConsolidated);

    const { result } = renderHook(() => useAnalysis());

    await act(async () => {
      await result.current.fetchAnalysis('test-analysis-999');
    });

    expect(result.current.analysisData).toEqual(mockConsolidated);
    expect(result.current.status).toBe('completed');
    expect(result.current.loading).toBe(false);
  });
});
