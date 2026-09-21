'use client';

import { useState, useCallback } from 'react';
import * as api from '@/lib/api';
import type { ConsolidatedAnalysisData, StartAnalysisRequest } from '@/lib/api';

export function useAnalysis(initialAnalysisId?: string) {
  const [analysisId, setAnalysisId] = useState<string | null>(initialAnalysisId || null);
  const [analysisData, setAnalysisData] = useState<ConsolidatedAnalysisData | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async (id: string): Promise<ConsolidatedAnalysisData | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getConsolidatedAnalysis(id);
      setAnalysisData(data);
      setAnalysisId(id);
      if (data.status === 'completed' || data.status === 'success') {
        setStatus('completed');
      } else if (data.status === 'failed') {
        setStatus('failed');
      } else {
        setStatus('running');
      }
      return data;
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch analysis';
      setError(msg);
      setStatus('failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(async (req: StartAnalysisRequest) => {
    setLoading(true);
    setError(null);
    setStatus('running');
    try {
      const res = await api.startAnalysis(req);
      const id = res.analysis_id || res.id;
      if (id) {
        setAnalysisId(id);
        return res;
      }
      throw new Error('Analysis ID was not returned');
    } catch (err: any) {
      const msg = err?.message || 'Failed to trigger analysis';
      setError(msg);
      setStatus('failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadPdf = useCallback(async () => {
    if (!analysisId) return;
    try {
      await api.downloadAnalysisPdf(analysisId);
    } catch (err: any) {
      setError(err?.message || 'Failed to download report PDF');
    }
  }, [analysisId]);

  return {
    analysisId,
    setAnalysisId,
    analysisData,
    status,
    loading,
    error,
    fetchAnalysis,
    start,
    downloadPdf,
  };
}

export default useAnalysis;
