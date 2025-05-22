import { useCallback, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import type { Transaction as DbTransaction, Category } from '@/types/database';

const supabase = createClientComponentClient<Database>();

// Helper function to get the current user's ID
async function getCurrentUserId(): Promise<number> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('No authenticated user');
  }
  
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('Failed to fetch user data');
  }
  
  return userData.id;
}

// Define the return type for the useFetchData hook
interface FetchDataResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// Generic hook for fetching data with loading/error states
function useFetchData<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = []
): FetchDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(true);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await fetchFn();
      
      // Only update state if the component is still mounted
      if (isMounted) {
        setData(result);
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, isMounted]);

  useEffect(() => {
    fetchData();
    
    // Cleanup function to prevent state updates on unmounted components
    return () => {
      setIsMounted(false);
    };
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
  };
}

// Type for the transaction row returned by Supabase
interface TransactionRow {
  id: string | number;
  user_id: number;
  account_id?: string | number | null;
  category_id: string | number | null;
  amount: number | string;
  date: string;
  description: string | null;
  is_income: boolean;
  receipt_url: string | null;
  type: string | null;
  created_at: string;
  updated_at: string | null;
  categories: { name: string } | null;
}

// Hook: Fetch transactions for the current authenticated user
// Hook: Get the current authenticated user
export function useCurrentUser() {
  return useFetchData(async () => {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  });
}

// Hook: Fetch all categories for the current user
export function useCategories() {
  return useFetchData<Category[]>(async () => {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  });
}

// Type for category spending data
type CategorySpending = Database['public']['Functions']['get_category_spending']['Returns'][0];

// Hook: Fetch category spending data
export function useCategorySpending() {
  return useFetchData<CategorySpending[]>(async () => {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .rpc('get_category_spending', {
        user_id: userId
      });

    if (error) throw error;
    return data || [];
  });
}

// Hook: Get the current budget for the user
export function useCurrentBudget() {
  return useFetchData(async () => {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  });
}

// Hook: Get budget summary with category breakdown
export function useBudgetSummary(budgetId?: number) {
  return useFetchData<{
    total: number;
    used: number;
    remaining: number;
    categories: Array<{
      name: string;
      amount: number;
      percentage: number;
    }>;
  }>(async () => {
    if (!budgetId) {
      return {
        total: 0,
        used: 0,
        remaining: 0,
        categories: []
      };
    }
    
    try {
      const { data, error } = await supabase
        .rpc('get_category_spending', {
          user_id: await getCurrentUserId()
        });

      if (error) throw error;
      
      // Transform the category spending data to match our expected format
      const categories = (data || []).map(cat => ({
        name: cat.category_name || 'Uncategorized',
        amount: cat.total_spent || 0,
        percentage: cat.percentage_used || 0
      }));
      
      const totalSpent = categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
      
      return {
        total: 1000, // Default budget total, adjust as needed
        used: totalSpent,
        remaining: Math.max(0, 1000 - totalSpent), // Default budget - spent
        categories
      };
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      return {
        total: 0,
        used: 0,
        remaining: 0,
        categories: []
      };
    }
  }, [budgetId]);
}

// Function to create a new transaction
export async function createTransaction(transactionData: Omit<DbTransaction, 'id' | 'created_at' | 'updated_at'>) {
  const userId = await getCurrentUserId();
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        ...transactionData,
        user_id: userId,
        amount: Number(transactionData.amount) // Ensure amount is a number
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  return data;
}

export function useTransactions(limit = 100) {
  return useFetchData<DbTransaction[]>(async (): Promise<DbTransaction[]> => {
    const userId = await getCurrentUserId();

    // Query transactions using the internal user ID
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Type assertion for the response data
    const transactions = data as unknown as TransactionRow[];

    // Transform the data to match the Transaction type with category info
    return (transactions || []).map(tx => ({
      id: Number(tx.id),
      user_id: tx.user_id,
      account_id: tx.account_id ? Number(tx.account_id) : null,
      category_id: tx.category_id ? Number(tx.category_id) : null,
      amount: Number(tx.amount),
      date: tx.date,
      description: tx.description || null,
      is_income: tx.is_income,
      receipt_url: tx.receipt_url || null,
      type: tx.type || null,
      created_at: tx.created_at,
      updated_at: tx.updated_at || null,
      ...(tx.categories && {
        categories: {
          id: tx.category_id ? Number(tx.category_id) : 0, // Default to 0 if null
          name: tx.categories.name || '',
          is_system: false, // Default value for is_system
          created_at: tx.created_at // Use transaction's created_at as fallback
        }
      })
    }));
  }, [limit]);
}
