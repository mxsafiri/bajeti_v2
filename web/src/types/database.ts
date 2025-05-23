// These types match the actual Supabase database schema

/**
 * User type - represents a user in the system
 * Note: The auth.users table is managed by Supabase Auth
 * This interface represents our custom users table that extends auth data
 */
export interface User {
  id: string; // UUID type from database
  auth_id: string | null; // Made nullable to match DB
  username: string | null; // Added to match DB
  email: string | null; // Made nullable to match DB
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  language: string | null; // Default: 'English'
  currency: string | null; // Default: 'TZS'
  email_notifications: boolean | null; // Default: true
  push_notifications: boolean | null; // Default: true
  sms_notifications: boolean | null; // Default: false
  theme: string | null; // Default: 'system'
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Budget type - represents a budget period (typically monthly)
 */
export interface Budget {
  id: number;
  user_id: string; // References users.id
  month: number;
  year: number;
  created_at: string | null;
}

/**
 * Category type - represents expense/income categories
 */
export interface Category {
  id: number;
  name: string;
  is_system: boolean | null;
  created_at: string | null;
}

/**
 * BudgetCategory type - represents the allocation of budget amounts to categories
 */
export interface BudgetCategory {
  id: string;
  budget_id: string | null; // References budgets.id
  category_id: number | null; // References categories.id
  amount: number;
  allocation_type: 'needs' | 'wants' | 'savings' | null;
  created_at: string | null;
}

/**
 * Transaction type - represents financial transactions
 */
export interface Transaction {
  id: number;
  user_id: string;
  account_id: number | null; // Reference to financial_accounts table
  category_id: number | null;
  amount: number;
  description: string | null;
  date: string;
  is_income: boolean;
  receipt_url: string | null;
  type: string | null; // Added to match database schema
  created_at: string;
  updated_at: string | null;
  // Include the joined category data
  categories?: Category;
}

/**
 * FinancialAccount type - represents bank accounts, wallets, etc.
 */
export interface FinancialAccount {
  id: number;
  user_id: string;
  name: string;
  type: string; // e.g., 'bank', 'cash', 'credit', 'investment'
  balance: number;
  currency: string;
  is_active: boolean;
  institution: string | null;
  account_mask: string | null; // Last 4 digits of account number
  created_at: string | null;
  updated_at: string | null;
}

/**
 * BudgetAllocation type - represents income allocations
 */
export interface BudgetAllocation {
  id: number;
  transaction_id: number | null; // References transactions.id
  user_id: string; // References users.id
  needs_amount: number;
  wants_amount: number;
  savings_amount: number;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  created_at: string | null;
}

// View types - not directly mapped to database tables

/**
 * BudgetSummary type - represents a summary of a budget
 */
export interface BudgetSummary {
  budget_id: string;
  budget_name: string;
  total_budget: number;
  period: string;
  start_date: string;
  end_date: string;
  categories: Array<{
    category_id: number;
    category_name: string;
    budgeted_amount: number;
    spent_amount: number;
  }>;
}

/**
 * CategorySpending type - represents spending by category
 */
export interface CategorySpending {
  category_id: number;
  category_name: string;
  user_id: string; // Changed from number to string to match User.id
  total_spent: number;
  transaction_count: number;
  first_transaction_date: string;
  last_transaction_date: string;
  budget?: number; // Optional budget amount for this category
}
