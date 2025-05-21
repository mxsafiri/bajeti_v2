// These types match the actual Supabase database schema

/**
 * User type - represents a user in the system
 * Note: The auth.users table is managed by Supabase Auth
 * This interface represents our custom users table that extends auth data
 */
export interface User {
  id: string; // Maps to auth.users.id
  auth_id: string; // Reference to auth.users.id
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Budget type - represents a budget period (typically monthly)
 */
export interface Budget {
  id: number;
  user_id: number; // References users.id
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
  id: number;
  budget_id: number | null; // References budgets.id
  category_id: number | null; // References categories.id
  amount: number;
  created_at: string | null;
}

/**
 * Transaction type - represents financial transactions
 */
export interface Transaction {
  id: number;
  user_id: number; // References users.id
  category_id: number | null; // References categories.id
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

/**
 * FinancialAccount type - represents bank accounts, wallets, etc.
 */
export interface FinancialAccount {
  id: number;
  user_id: number; // References users.id
  name: string;
  type: string; // e.g., 'bank', 'cash', 'credit', 'investment'
  balance: number;
  currency: string;
  is_active: boolean;
  institution: string | null;
  account_mask: string | null; // Last 4 digits of account number
  created_at: string;
  updated_at: string | null;
}

// View types - not directly mapped to database tables

/**
 * BudgetSummary type - represents a summary of a budget
 */
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
  days_left?: number;
  daily_budget?: number;
}

/**
 * CategorySpending type - represents spending by category
 */
export interface CategorySpending {
  category_id: number;
  category_name: string;
  user_id: number;
  total_spent: number;
  transaction_count: number;
  first_transaction_date: string;
  last_transaction_date: string;
  budget?: number; // Optional budget amount for this category
}

/**
 * Type conversion utilities
 */
export const typeConverters = {
  // Convert database user_id (number) to auth_id (string) and vice versa
  userIdToAuthId: (userId: number): string => userId.toString(),
  authIdToUserId: (authId: string): number => parseInt(authId, 10),
  
  // Convert any string to number safely
  toNumber: (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(value);
  },
  
  // Convert any number to string safely
  toString: (value: number | string): string => {
    if (typeof value === 'string') return value;
    return value.toString();
  }
}
