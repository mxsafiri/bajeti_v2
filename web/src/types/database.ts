// These types match the actual Supabase database schema

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Budget {
  id: number;
  user_id: string;
  month: number;
  year: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  is_system: boolean | null;
  created_at: string | null;
}

export interface BudgetCategory {
  id: number;
  budget_id: number | null;
  category_id: number | null;
  amount: number;
  created_at: string | null;
}

export interface Transaction {
  id: number;
  user_id: string;
  category_id: number | null;
  amount: number;
  description: string | null;
  date: string;
  is_income: boolean;
  receipt_url: string | null;
  created_at: string;
  updated_at: string | null;
  // Include the joined category data
  categories?: Category;
}

export interface FinancialAccount {
  id: number;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  institution: string | null;
  account_mask: string | null;
  created_at: string;
  updated_at: string | null;
}

// View types
export interface BudgetSummary {
  budget_id: number;
  budget_name: string;
  total_budget: number;
  period: string;
  start_date: string;
  end_date: string | null;
  spent_amount: number;
  remaining_amount: number;
  percent_used: number;
}

export interface CategorySpending {
  category_id: number;
  category_name: string;
  user_id: number;
  total_spent: number;
  transaction_count: number;
  first_transaction_date: string;
  last_transaction_date: string;
}
