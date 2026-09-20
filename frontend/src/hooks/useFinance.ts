'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import type {
  Expense,
  ExpenseSummary,
  CashFlowOverview,
  SavingsOverview,
  SavingsGoal,
  BudgetOverview,
  Budget,
  DebtOverview,
  Debt,
  BorrowingOverview,
  Borrowing,
  CreditOverview,
  CreditScore,
  UserProfile,
  FinanceCalculateRequest,
  FinanceCalculateResponse,
} from '@/types/finance';

const DEFAULT_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

export function getStoredProfileId(): string {
  if (typeof window === 'undefined') return DEFAULT_PROFILE_ID;
  return localStorage.getItem('udyam_profile_id') || DEFAULT_PROFILE_ID;
}

export function useFinance(initialProfileId?: string) {
  const [profileId, setProfileId] = useState<string>(initialProfileId || getStoredProfileId());
  
  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [expensesLoading, setExpensesLoading] = useState<boolean>(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);

  // Cash Flow state
  const [cashFlow, setCashFlow] = useState<CashFlowOverview | null>(null);
  const [cashFlowLoading, setCashFlowLoading] = useState<boolean>(false);
  const [cashFlowError, setCashFlowError] = useState<string | null>(null);

  // Savings state
  const [savings, setSavings] = useState<SavingsOverview | null>(null);
  const [savingsLoading, setSavingsLoading] = useState<boolean>(false);
  const [savingsError, setSavingsError] = useState<string | null>(null);

  // Budgets state
  const [budgets, setBudgets] = useState<BudgetOverview | null>(null);
  const [budgetsLoading, setBudgetsLoading] = useState<boolean>(false);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);

  // Debts state
  const [debts, setDebts] = useState<DebtOverview | null>(null);
  const [debtsLoading, setDebtsLoading] = useState<boolean>(false);
  const [debtsError, setDebtsError] = useState<string | null>(null);

  // Borrowings state
  const [borrowings, setBorrowings] = useState<BorrowingOverview | null>(null);
  const [borrowingsLoading, setBorrowingsLoading] = useState<boolean>(false);
  const [borrowingsError, setBorrowingsError] = useState<string | null>(null);

  // Credit state
  const [credit, setCredit] = useState<CreditOverview | null>(null);
  const [creditLoading, setCreditLoading] = useState<boolean>(false);
  const [creditError, setCreditError] = useState<string | null>(null);

  // User Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Finance calculation / amortization state
  const [calculationResult, setCalculationResult] = useState<FinanceCalculateResponse | null>(null);
  const [calculationLoading, setCalculationLoading] = useState<boolean>(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Sync profileId
  const updateProfileId = useCallback((newId: string) => {
    setProfileId(newId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('udyam_profile_id', newId);
    }
  }, []);

  // Fetch functions
  const fetchExpenses = useCallback(async (category?: string) => {
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const [expData, sumData] = await Promise.all([
        api.getExpenses(profileId, category),
        api.getExpenseSummary(profileId),
      ]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setExpenseSummary(sumData);
      return { expenses: expData, summary: sumData };
    } catch (err: any) {
      setExpensesError(err?.message || 'Failed to load expenses');
      return null;
    } finally {
      setExpensesLoading(false);
    }
  }, [profileId]);

  const addExpense = useCallback(async (data: Partial<Expense>) => {
    const res = await api.createExpense(profileId, data);
    await fetchExpenses();
    return res;
  }, [profileId, fetchExpenses]);

  const removeExpense = useCallback(async (expenseId: string) => {
    const res = await api.deleteExpense(expenseId, profileId);
    await fetchExpenses();
    return res;
  }, [profileId, fetchExpenses]);

  const fetchCashFlow = useCallback(async () => {
    setCashFlowLoading(true);
    setCashFlowError(null);
    try {
      const data = await api.getCashFlow(profileId);
      setCashFlow(data);
      return data;
    } catch (err: any) {
      setCashFlowError(err?.message || 'Failed to load cash flow');
      return null;
    } finally {
      setCashFlowLoading(false);
    }
  }, [profileId]);

  const addCashFlowEntry = useCallback(async (data: any) => {
    const res = await api.createCashFlowEntry(profileId, data);
    await fetchCashFlow();
    return res;
  }, [profileId, fetchCashFlow]);

  const fetchSavings = useCallback(async () => {
    setSavingsLoading(true);
    setSavingsError(null);
    try {
      const data = await api.getSavings(profileId);
      setSavings(data);
      return data;
    } catch (err: any) {
      setSavingsError(err?.message || 'Failed to load savings');
      return null;
    } finally {
      setSavingsLoading(false);
    }
  }, [profileId]);

  const addSavingsGoal = useCallback(async (data: any) => {
    const res = await api.createSavingsGoal(profileId, data);
    await fetchSavings();
    return res;
  }, [profileId, fetchSavings]);

  const addSavingsTransaction = useCallback(async (goalId: string, data: any) => {
    const res = await api.addSavingsTransaction(goalId, data);
    await fetchSavings();
    return res;
  }, [fetchSavings]);

  const fetchBudgets = useCallback(async () => {
    setBudgetsLoading(true);
    setBudgetsError(null);
    try {
      const data = await api.getBudgets(profileId);
      setBudgets(data);
      return data;
    } catch (err: any) {
      setBudgetsError(err?.message || 'Failed to load budgets');
      return null;
    } finally {
      setBudgetsLoading(false);
    }
  }, [profileId]);

  const addBudget = useCallback(async (data: any) => {
    const res = await api.createBudget(profileId, data);
    await fetchBudgets();
    return res;
  }, [profileId, fetchBudgets]);

  const fetchDebts = useCallback(async () => {
    setDebtsLoading(true);
    setDebtsError(null);
    try {
      const data = await api.getDebts(profileId);
      setDebts(data);
      return data;
    } catch (err: any) {
      setDebtsError(err?.message || 'Failed to load debts');
      return null;
    } finally {
      setDebtsLoading(false);
    }
  }, [profileId]);

  const addDebt = useCallback(async (data: any) => {
    const res = await api.createDebt(profileId, data);
    await fetchDebts();
    return res;
  }, [profileId, fetchDebts]);

  const addDebtPayment = useCallback(async (debtId: string, data: any) => {
    const res = await api.addDebtPayment(debtId, data);
    await fetchDebts();
    return res;
  }, [fetchDebts]);

  const fetchBorrowings = useCallback(async () => {
    setBorrowingsLoading(true);
    setBorrowingsError(null);
    try {
      const data = await api.getBorrowings(profileId);
      setBorrowings(data);
      return data;
    } catch (err: any) {
      setBorrowingsError(err?.message || 'Failed to load borrowings');
      return null;
    } finally {
      setBorrowingsLoading(false);
    }
  }, [profileId]);

  const addBorrowing = useCallback(async (data: any) => {
    const res = await api.createBorrowing(profileId, data);
    await fetchBorrowings();
    return res;
  }, [profileId, fetchBorrowings]);

  const fetchCredit = useCallback(async () => {
    setCreditLoading(true);
    setCreditError(null);
    try {
      const data = await api.getCreditScore(profileId);
      setCredit(data);
      return data;
    } catch (err: any) {
      setCreditError(err?.message || 'Failed to load credit score');
      return null;
    } finally {
      setCreditLoading(false);
    }
  }, [profileId]);

  const addCreditScore = useCallback(async (data: any) => {
    const res = await api.createCreditScore(profileId, data);
    await fetchCredit();
    return res;
  }, [profileId, fetchCredit]);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await api.getProfile(profileId);
      setProfile(data);
      return data;
    } catch {
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [profileId]);

  // Direct Finance Calculation & Amortization Engine
  const calculate = useCallback(async (request: FinanceCalculateRequest) => {
    setCalculationLoading(true);
    setCalculationError(null);
    try {
      const res = await api.calculateFinance(request);
      setCalculationResult(res);
      return res;
    } catch (err: any) {
      setCalculationError(err?.message || 'Finance calculation failed');
      return null;
    } finally {
      setCalculationLoading(false);
    }
  }, []);

  return {
    profileId,
    setProfileId: updateProfileId,
    // Expenses
    expenses,
    expenseSummary,
    expensesLoading,
    expensesError,
    fetchExpenses,
    addExpense,
    removeExpense,
    // Cash Flow
    cashFlow,
    cashFlowLoading,
    cashFlowError,
    fetchCashFlow,
    addCashFlowEntry,
    // Savings
    savings,
    savingsLoading,
    savingsError,
    fetchSavings,
    addSavingsGoal,
    addSavingsTransaction,
    // Budgets
    budgets,
    budgetsLoading,
    budgetsError,
    fetchBudgets,
    addBudget,
    // Debts
    debts,
    debtsLoading,
    debtsError,
    fetchDebts,
    addDebt,
    addDebtPayment,
    // Borrowings
    borrowings,
    borrowingsLoading,
    borrowingsError,
    fetchBorrowings,
    addBorrowing,
    // Credit
    credit,
    creditLoading,
    creditError,
    fetchCredit,
    addCreditScore,
    // Profile
    profile,
    profileLoading,
    fetchProfile,
    // Calculation & Scenarios
    calculationResult,
    calculationLoading,
    calculationError,
    calculate,
  };
}

export default useFinance;
