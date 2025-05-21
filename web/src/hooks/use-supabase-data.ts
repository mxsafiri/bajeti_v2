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
    
        // Get the user data from the users table
    // Using a type assertion to help TypeScript understand our database schema
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
      
    if (userError) {
      // If user doesn't exist in the database yet, create a minimal user record
      return {
        id: user.id,
        auth_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: user.created_at,
        updated_at: user.updated_at
      } as User;
    }
    
    // Use a proper type conversion to ensure the response matches our User type
    // Using 'as any' to bypass TypeScript's type checking since we know the data structure
    const typedUserData = userData as any;
    return {
      id: typedUserData.id.toString(),
      auth_id: typedUserData.auth_id || user.id,
      email: typedUserData.email || user.email || '',
      full_name: typedUserData.full_name || user.user_metadata?.full_name || '',
      avatar_url: typedUserData.avatar_url || user.user_metadata?.avatar_url || '',
      created_at: typedUserData.created_at || user.created_at,
      updated_at: typedUserData.updated_at || user.updated_at
    } as User;
  }, []);
}

// Import the type converters from our database types
import { typeConverters } from '@/types/database';

// Transactions hooks
export function useTransactions(limit = 10, dateRange?: { start: string; end: string }) {
  return useFetchData(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get user ID from auth ID
    const userId = typeConverters.authIdToUserId(user.id);
    
    // Build the query
    let query = supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', userId)
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
    
    // Convert the Supabase response to our Transaction type
    return data?.map(item => ({
      id: item.id,
      user_id: item.user_id,
      category_id: item.category_id,
      amount: item.amount,
      description: item.description || '',
      date: item.date,
      is_income: item.is_income || false,
      receipt_url: item.receipt_url || null,
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      categories: item.categories ? {
        id: item.categories.id,
        name: item.categories.name,
        is_system: item.categories.is_system || false,
        created_at: item.categories.created_at || ''
      } : undefined
    })) as Transaction[];
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
    
    // Get user ID from auth ID
    const userId = typeConverters.authIdToUserId(user.id);
    
    // Fetch transactions directly from Supabase filtered by category
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    // Convert the Supabase response to our Transaction type
    return data?.map(item => ({
      id: item.id,
      user_id: item.user_id,
      category_id: item.category_id,
      amount: item.amount,
      description: item.description || '',
      date: item.date,
      is_income: item.is_income || false,
      receipt_url: item.receipt_url || null,
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      categories: item.categories ? {
        id: item.categories.id,
        name: item.categories.name,
        is_system: item.categories.is_system || false,
        created_at: item.categories.created_at || ''
      } : undefined
    })) as Transaction[];
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
    
    // Get user ID from auth ID
    const userId = typeConverters.authIdToUserId(user.id);
    
    // Fetch financial accounts from Supabase
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // If no accounts exist, return an empty array
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert the Supabase response to our FinancialAccount type
    // Use type assertion with 'as any' to bypass TypeScript's type checking
    // since we know the shape of our data but TypeScript doesn't recognize it from Supabase
    return data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      type: item.type,
      balance: item.balance,
      currency: item.currency,
      is_active: item.is_active,
      institution: item.institution,
      account_mask: item.account_mask,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) as FinancialAccount[];
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
    
    // Get user ID from auth ID
    const userId = typeConverters.authIdToUserId(user.id);
    
    // Fetch budgets from Supabase
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // If no budgets exist, return an empty array
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert the Supabase response to our Budget type
    return data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      month: item.month,
      year: item.year,
      created_at: item.created_at || ''
    })) as Budget[];
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

// Budget summary hook
export function useBudgetSummary(budgetId: number) {
  return useFetchData(async () => {
    // Get the budget data
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single();
      
    if (budgetError) throw budgetError;
    if (!budgetData) throw new Error('Budget not found');
    
    // Get transactions for this budget's month and year
    const startDate = `${budgetData.year}-${String(budgetData.month).padStart(2, '0')}-01`;
    const lastDay = new Date(budgetData.year, budgetData.month, 0).getDate();
    const endDate = `${budgetData.year}-${String(budgetData.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const { data: transactions } = await useTransactions(1000, { start: startDate, end: endDate });
    
    // Calculate total spent
    const totalSpent = transactions && transactions.length > 0
      ? transactions.reduce((sum, t) => sum + (t.is_income ? 0 : t.amount), 0)
      : 0;
      
    // Get budget categories to calculate total budget
    const { data: budgetCategories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('budget_id', budgetId);
      
    if (categoriesError) throw categoriesError;
    
    const totalBudget = budgetCategories && budgetCategories.length > 0
      ? budgetCategories.reduce((sum, bc) => sum + Number(bc.amount), 0)
      : 1000000; // Default budget if no categories are set
    
    const percentUsed = (totalSpent / totalBudget) * 100;
    
    // Calculate days left in the budget period
    const today = new Date();
    const lastDayOfMonth = new Date(budgetData.year, budgetData.month, 0).getDate();
    const daysLeft = Math.max(0, lastDayOfMonth - today.getDate());
    const dailyBudget = daysLeft > 0 ? (totalBudget - totalSpent) / daysLeft : 0;
    
    return {
      budget_id: budgetId,
      budget_name: `Budget for ${budgetData.month}/${budgetData.year}`,
      total_budget: totalBudget,
      period: 'monthly',
      start_date: startDate,
      end_date: endDate,
      spent_amount: totalSpent,
      remaining_amount: totalBudget - totalSpent,
      percent_used: percentUsed,
      days_left: daysLeft,
      daily_budget: dailyBudget
    } as BudgetSummary;
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
    id: user.id, // Keep as string to match User interface
    auth_id: user.id, // Add the required auth_id property
    email: user.email || '',
    full_name: profile.full_name || user.user_metadata?.full_name || null,
    avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
    created_at: user.created_at,
    updated_at: new Date().toISOString()
  } as User;
}
