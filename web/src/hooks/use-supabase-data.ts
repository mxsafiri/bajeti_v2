'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { 
  User, 
  Budget, 
  Category, 
  Transaction, 
  FinancialAccount, 
  BudgetSummary,
  CategorySpending
} from '@/types/database';

// Create a Supabase client for use in the component
const supabase = createClientComponentClient<Database>();

// Generic hook for fetching data with error and loading states
export function useFetchData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchFn();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, error, isLoading };
}

// User data hooks
export function useCurrentUser() {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Since we don't have a users table in the current schema, return a mock user
    // In a real app, you would fetch this from the users table
    return {
      id: parseInt(user.id),
      email: user.email || '',
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at,
      updated_at: user.updated_at
    } as User;
  }, []);
}

// Transactions hooks
export function useTransactions(limit = 10, dateRange?: { start: string; end: string }) {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Build the query
    let query = supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);
    }
    
    // Apply limit
    query = query.limit(limit);
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) throw error;
    return data as Transaction[];
  }, [limit, dateRange?.start, dateRange?.end]);
}

export function useRecentTransactions(limit = 5) {
  return useTransactions(limit);
}

export function useTransactionsByCategory(categoryId: number) {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Filter mock transactions by category
    // In a real app, you would fetch this from the transactions table
    const { data: allTransactions } = await useTransactions(100);
    return (allTransactions || []).filter(t => t.category_id === categoryId);
  }, [categoryId]);
}

// Categories hooks
export function useCategories() {
  return useFetchData(async () => {
    // Query the categories table
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  }, []);
}

// Financial accounts hooks
export function useFinancialAccounts() {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Mock financial accounts data
    const mockAccounts: FinancialAccount[] = [
      {
        id: 1,
        user_id: parseInt(user.id),
        name: 'CRDB Savings',
        type: 'savings',
        balance: 1250000,
        currency: 'TZS',
        is_active: true,
        institution: 'CRDB Bank',
        account_mask: '****1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: parseInt(user.id),
        name: 'NMB Checking',
        type: 'checking',
        balance: 850000,
        currency: 'TZS',
        is_active: true,
        institution: 'NMB Bank',
        account_mask: '****5678',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: parseInt(user.id),
        name: 'M-Pesa',
        type: 'mobile',
        balance: 125000,
        currency: 'TZS',
        is_active: true,
        institution: 'Vodacom',
        account_mask: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        user_id: parseInt(user.id),
        name: 'Tigo Pesa',
        type: 'mobile',
        balance: 75000,
        currency: 'TZS',
        is_active: true,
        institution: 'Tigo',
        account_mask: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        user_id: parseInt(user.id),
        name: 'SACCO Loan',
        type: 'loan',
        balance: -500000,
        currency: 'TZS',
        is_active: true,
        institution: 'SACCO',
        account_mask: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return mockAccounts;
  }, []);
}

export function useFinancialAccountsByType(type: string) {
  return useFetchData(async () => {
    const { data: accounts } = await useFinancialAccounts();
    return (accounts || []).filter(account => account.type === type);
  }, [type]);
}

// Budgets hooks
export function useBudgets() {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Mock budget data
    const mockBudgets: Budget[] = [
      {
        id: 1,
        user_id: parseInt(user.id),
        month: 5, // May
        year: 2025,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: parseInt(user.id),
        month: 4, // April
        year: 2025,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: parseInt(user.id),
        month: 3, // March
        year: 2025,
        created_at: new Date().toISOString()
      }
    ];
    
    return mockBudgets;
  }, []);
}

export function useCurrentBudget() {
  return useFetchData(async () => {
    const { data: budgets } = await useBudgets();
    if (!budgets || budgets.length === 0) return null;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();
    
    // Find a budget for the current month and year
    const currentBudget = budgets.find(budget => 
      budget.month === currentMonth && budget.year === currentYear
    );
    
    return currentBudget || budgets[0]; // Return current budget or the first one as fallback
  }, []);
}

// Budget summary hooks
export function useBudgetSummary(budgetId: number) {
  return useFetchData(async () => {
    const { data: budget } = await useCurrentBudget();
    const { data: transactions } = await useTransactions(100);
    
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    // Calculate budget summary from transactions
    const totalBudget = 3000000; // Mock total budget amount
    const spentAmount = transactions
      ? transactions
          .filter(t => !t.is_income)
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;
    
    const mockBudgetSummary: BudgetSummary = {
      budget_id: budget.id,
      budget_name: `Budget for ${budget.month}/${budget.year}`,
      total_budget: totalBudget,
      period: 'monthly',
      start_date: `${budget.year}-${String(budget.month).padStart(2, '0')}-01`,
      end_date: null,
      spent_amount: spentAmount,
      remaining_amount: totalBudget - spentAmount,
      percent_used: (spentAmount / totalBudget) * 100
    };
    
    return mockBudgetSummary;
  }, [budgetId]);
}

// Category spending hooks
export function useCategorySpending() {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: transactions } = await useTransactions(100);
    const { data: categories } = await useCategories();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    if (!transactions || !categories) {
      return [];
    }
    
    // Calculate spending by category
    const categoryMap = new Map<number, CategorySpending>();
    
    // Initialize with all categories
    categories.forEach(category => {
      categoryMap.set(category.id, {
        category_id: category.id,
        category_name: category.name,
        user_id: parseInt(user.id),
        total_spent: 0,
        transaction_count: 0,
        first_transaction_date: '',
        last_transaction_date: ''
      });
    });
    
    // Calculate spending for each category
    transactions.forEach(transaction => {
      if (transaction.category_id && !transaction.is_income) {
        const categoryId = transaction.category_id;
        const categorySpending = categoryMap.get(categoryId);
        
        if (categorySpending) {
          categorySpending.total_spent += Number(transaction.amount);
          categorySpending.transaction_count += 1;
          
          const transactionDate = transaction.date;
          
          if (!categorySpending.first_transaction_date || transactionDate < categorySpending.first_transaction_date) {
            categorySpending.first_transaction_date = transactionDate;
          }
          
          if (!categorySpending.last_transaction_date || transactionDate > categorySpending.last_transaction_date) {
            categorySpending.last_transaction_date = transactionDate;
          }
        }
      }
    });
    
    // Convert map to array and sort by total spent
    return Array.from(categoryMap.values())
      .filter(c => c.transaction_count > 0)
      .sort((a, b) => b.total_spent - a.total_spent);
  }, []);
}

// Data mutation functions
export async function createTransaction(transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock creating a transaction
  // In a real app, this would insert into the database
  console.log('Creating transaction:', transaction);
  
  // Return a mock transaction with generated ID
  return {
    id: Math.floor(Math.random() * 1000) + 6, // Generate random ID starting from 6
    user_id: parseInt(user.id),
    category_id: transaction.category_id,
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date,
    is_income: transaction.is_income,
    receipt_url: transaction.receipt_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Transaction;
}

export async function updateTransaction(id: number, transaction: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock updating a transaction
  // In a real app, this would update the database
  console.log('Updating transaction:', id, transaction);
  
  // Return a mock updated transaction
  return {
    id: id,
    user_id: parseInt(user.id),
    category_id: transaction.category_id || 1,
    amount: transaction.amount || 0,
    description: transaction.description || '',
    date: transaction.date || new Date().toISOString().split('T')[0],
    is_income: transaction.is_income || false,
    receipt_url: transaction.receipt_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as Transaction;
}

export async function deleteTransaction(id: number) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock deleting a transaction
  // In a real app, this would delete from the database
  console.log('Deleting transaction:', id);
  
  return true;
}

export async function createFinancialAccount(account: Omit<FinancialAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock creating a financial account
  // In a real app, this would insert into the database
  console.log('Creating financial account:', account);
  
  // Return a mock account with generated ID
  return {
    id: Math.floor(Math.random() * 1000) + 6, // Generate random ID starting from 6
    user_id: parseInt(user.id),
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    is_active: account.is_active,
    institution: account.institution,
    account_mask: account.account_mask,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as FinancialAccount;
}

export async function updateFinancialAccount(id: number, account: Partial<Omit<FinancialAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock updating a financial account
  // In a real app, this would update the database
  console.log('Updating financial account:', id, account);
  
  // Return a mock updated account
  return {
    id: id,
    user_id: parseInt(user.id),
    name: account.name || 'Account',
    type: account.type || 'checking',
    balance: account.balance || 0,
    currency: account.currency || 'TZS',
    is_active: account.is_active !== undefined ? account.is_active : true,
    institution: account.institution || null,
    account_mask: account.account_mask || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as FinancialAccount;
}

export async function deleteFinancialAccount(id: number) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock deleting a financial account
  // In a real app, this would delete from the database
  console.log('Deleting financial account:', id);
  
  return true;
}

export async function createCategory(category: { name: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock creating a category
  // In a real app, this would insert into the database
  console.log('Creating category:', category);
  
  // Return a mock category with generated ID
  return {
    id: Math.floor(Math.random() * 1000) + 12, // Generate random ID starting from 12
    name: category.name,
    is_system: false,
    created_at: new Date().toISOString()
  } as Category;
}

export async function updateUserProfile(profile: Partial<Omit<User, 'id' | 'email' | 'created_at' | 'updated_at'>>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mock updating a user profile
  // In a real app, this would update the database
  console.log('Updating user profile:', profile);
  
  // Return a mock updated user
  return {
    id: parseInt(user.id),
    email: user.email || '',
    full_name: profile.full_name || user.user_metadata?.full_name || null,
    avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
    created_at: user.created_at,
    updated_at: new Date().toISOString()
  } as User;
}
