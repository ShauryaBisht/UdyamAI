// ============================================================
// EXPENSE TYPES
// ============================================================
export interface Expense {
  id: string;
  profile_id: string;
  category: string;
  description?: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseSummary {
  total_expenses: number;
  by_category: Record<string, number>;
  recurring_total: number;
  count: number;
}

// ============================================================
// CASH FLOW TYPES
// ============================================================
export interface CashFlowEntry {
  id: string;
  profile_id: string;
  entry_type: 'income' | 'expense';
  category: string;
  description?: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface CashFlowOverview {
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  entries: CashFlowEntry[];
}

// ============================================================
// SAVINGS TYPES
// ============================================================
export interface SavingsGoal {
  id: string;
  profile_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  priority: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  progress_percent: number;
}

export interface SavingsTransaction {
  id: string;
  goal_id: string;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  date: string;
  notes?: string;
  created_at: string;
}

export interface SavingsOverview {
  goals: SavingsGoal[];
  total_saved: number;
  total_target: number;
  overall_progress: number;
}

// ============================================================
// BUDGET TYPES
// ============================================================
export interface BudgetItem {
  id: string;
  budget_id: string;
  category: string;
  item_type: 'income' | 'expense';
  planned_amount: number;
  actual_amount: number;
  notes?: string;
  variance: number;
}

export interface Budget {
  id: string;
  profile_id: string;
  name: string;
  period_type: string;
  start_date: string;
  end_date: string;
  total_income_target: number;
  total_expense_target: number;
  total_actual_income: number;
  total_actual_expenses: number;
  status: string;
  notes?: string;
  items: BudgetItem[];
  created_at: string;
}

export interface BudgetOverview {
  budgets: Budget[];
  active_count: number;
  total_budgeted_income: number;
  total_budgeted_expenses: number;
}

// ============================================================
// DEBT TYPES
// ============================================================
export interface Debt {
  id: string;
  profile_id: string;
  lender_name: string;
  loan_type: string;
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  emi_amount?: number;
  tenure_months?: number;
  start_date?: string;
  end_date?: string;
  next_emi_date?: string;
  status: string;
  scheme_name?: string;
  notes?: string;
  paid_percent: number;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  principal_portion: number;
  interest_portion: number;
  payment_date: string;
  payment_mode?: string;
  notes?: string;
  created_at: string;
}

export interface DebtOverview {
  debts: Debt[];
  total_outstanding: number;
  total_principal: number;
  total_monthly_emi: number;
  debt_to_income_ratio?: number;
}

// ============================================================
// BORROWING TYPES
// ============================================================
export interface Borrowing {
  id: string;
  profile_id: string;
  lender_name: string;
  loan_type: string;
  requested_amount: number;
  approved_amount?: number;
  interest_rate?: number;
  tenure_months?: number;
  status: string;
  application_date?: string;
  scheme_id?: string;
  eligibility_met: boolean;
  documents_required?: string;
  notes?: string;
  created_at: string;
}

export interface BorrowingOverview {
  borrowings: Borrowing[];
  exploring_count: number;
  applied_count: number;
  approved_count: number;
  total_requested: number;
  total_approved: number;
}

// ============================================================
// CREDIT SCORE TYPES
// ============================================================
export interface CreditScore {
  id: string;
  profile_id: string;
  score: number;
  provider: string;
  factors?: string;
  rating?: string;
  suggestions?: string;
  recorded_date: string;
  created_at: string;
}

export interface CreditOverview {
  latest_score: CreditScore | null;
  history: CreditScore[];
  trend: 'improving' | 'declining' | 'stable';
  rating: string;
  suggestions: string[];
}

// ============================================================
// RECYCLE BIN TYPES
// ============================================================
export interface RecycleBinItem {
  id: string;
  item_type: string;
  item_id: string;
  item_data: string;
  deleted_at: string;
  expires_at?: string;
  restored: boolean;
  created_at: string;
}

// ============================================================
// PRIVACY & CONSENT TYPES
// ============================================================
export interface PrivacyConsent {
  id: string;
  profile_id: string;
  consent_type: string;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  version: string;
  created_at: string;
}

export interface PrivacyOverview {
  consents: PrivacyConsent[];
  all_data_shared: boolean;
  analytics_enabled: boolean;
  ai_processing_enabled: boolean;
}

// ============================================================
// SETTINGS TYPES
// ============================================================
export interface UserSettings {
  id: string;
  profile_id: string;
  currency: string;
  date_format: string;
  notification_email: boolean;
  notification_sms: boolean;
  notification_push: boolean;
  language: string;
  theme: string;
  default_view: string;
  auto_backup: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PROFILE TYPES
// ============================================================
export interface UserProfile {
  id: string;
  auth_user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
  business_type?: string;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// FINANCE CALCULATION & AMORTIZATION TYPES
// ============================================================
export interface ScenarioMultiplierInput {
  revenue_multiplier: number;
  operating_cost_multiplier: number;
}

export interface ScenarioConfigInput {
  worst_case?: ScenarioMultiplierInput;
  expected_case?: ScenarioMultiplierInput;
  best_case?: ScenarioMultiplierInput;
}

export interface RepaymentScheduleItemResponse {
  period_number: number;
  opening_balance: number;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  closing_balance: number;
  remaining_principal: number;
  is_moratorium: boolean;
  verification_required?: boolean;
}

export interface FinancialScenarioResponse {
  scenario_type: 'worst_case' | 'expected_case' | 'best_case' | string;
  sufficient_assumptions_exist: boolean;
  revenue?: number | null;
  operating_costs?: number | null;
  surplus?: number | null;
  loan_repayment?: number | null;
  cash_surplus?: number | null;
  monthly_revenue?: number | null;
  monthly_expenses?: number | null;
  monthly_profit?: number | null;
  repayment_coverage?: number | null;
  data_source?: string | null;
  marked_assumptions?: Record<string, any> | null;
  cash_flow?: Record<string, any> | null;
}

export interface FinanceCalculateRequest {
  available_capital: number;
  desired_project_cost?: number | null;
  scheme_id?: string | null;
  scheme_rule_id?: string | null;
  interest_rate?: number | null;
  tenure_months?: number | null;
  moratorium_months?: number | null;
  loan_percent?: number | null;
  beneficiary_contribution_percent?: number | null;
  payment_frequency?: string | null;
  moratorium_interest_treatment?: string | null;
  monthly_revenue?: number | null;
  monthly_operating_cost?: number | null;
  verified_revenue?: number | null;
  verified_operating_cost?: number | null;
  scenario_config?: ScenarioConfigInput | null;
  analysis_run_id?: string | null;
}

export interface FinanceCalculateResponse {
  status: string;
  available_capital: number;
  required_contribution: number;
  shortfall: number;
  desired_project_cost?: number | null;
  feasible_project_cost?: number | null;
  potential_loan?: number | null;
  project_cost_cap_applied?: boolean;
  loan_cap_applied?: boolean;
  max_project_cost_limit?: number | null;
  max_loan_amount_limit?: number | null;
  beneficiary_contribution_percent?: number | null;
  loan_percent?: number | null;
  interest_rate?: number | null;
  tenure_months?: number | null;
  moratorium_months?: number | null;
  payment_frequency?: string | null;
  moratorium_interest_treatment?: string | null;
  verification_required?: boolean;
  monthly_emi?: number | null;
  total_interest?: number | null;
  total_repayment?: number | null;
  working_capital?: number | null;
  repayment_schedule: RepaymentScheduleItemResponse[];
  financial_scenarios: FinancialScenarioResponse[];
  message?: string | null;
}
