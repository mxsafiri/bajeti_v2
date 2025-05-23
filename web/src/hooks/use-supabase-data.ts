import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import type { User as UserType, Transaction as DbTransaction, Category, FinancialAccount } from '@/types/database';

// For client components, use createBrowserClient from @supabase/ssr
// It doesn't need the cookie handling options like createServerClient does.
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to get the current user's ID
async function getCurrentUserId(): Promise<string> {
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
  return useFetchData(async (): Promise<UserType | null> => {
    const userId = await getCurrentUserId(); // userId is now string
    
    const { data, error } = await supabase
      .from('users')
      .select('*') // Selects all columns, including new ones
      .eq('id', userId) // Compare with string UUID
      .single();

    if (error) {
      // PGRST116 means no rows found, which can be valid if user record somehow doesn't exist
      if (error.code === 'PGRST116') {
        console.warn(`No user found in 'users' table with id: ${userId}`);
        return null;
      }
      throw error;
    }
    return data as UserType | null; // Assert to our updated UserType
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
// Explicitly defined because Database['public']['Functions']['get_category_spending'] is not available in generated types.
// Consider regenerating database types if 'get_category_spending' is a valid RPC.
interface CategorySpending {
  category_name: string | null;
  total_spent?: number | null; // Allows number, null, or undefined
  percentage_used: number | null;
  category_id: string | number | null; // Added based on usage in summary/page.tsx
  budget_amount: number | null;      // Added based on usage in summary/page.tsx
  // Add other properties if returned by the RPC and needed.
}

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
      
      // Explicitly type data from RPC
      const rpcData = data as CategorySpending[] | null;

      // Transform the category spending data to match our expected format
      const categories = (rpcData || []).map((cat: CategorySpending) => ({
        name: cat.category_name || 'Uncategorized',
        amount: cat.total_spent || 0,
        percentage: cat.percentage_used || 0
      }));
      
      const totalSpent = categories.reduce((sum: number, cat: { name: string; amount: number; percentage: number }) => sum + (cat.amount || 0), 0);
      
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

// Hook: Fetch all financial accounts for the current user
export function useFinancialAccounts() {
  return useFetchData<FinancialAccount[]>(async () => {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching financial accounts:', error);
      throw error;
    }
    return data || [];
  });
}

// Hook: Fetch transactions for a specific account
export function useTransactionsForAccount(accountId: number | null, limit = 100) {
  return useFetchData<DbTransaction[]>(async (): Promise<DbTransaction[]> => {
    if (!accountId) return []; // If no accountId is provided, return empty array

    const userId = await getCurrentUserId(); // Ensure we only fetch for the logged-in user

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId) // Security: ensure user owns the transactions
      .eq('account_id', accountId) // Filter by account_id
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching transactions for account ${accountId}:`, error);
      throw error;
    }

    // Type assertion and mapping (similar to useTransactions)
    const transactions = data as unknown as TransactionRow[];

    return transactions.map(tx => ({
      id: Number(tx.id),
      user_id: String(tx.user_id),
      account_id: tx.account_id == null ? null : Number(tx.account_id),
      category_id: tx.category_id == null ? null : Number(tx.category_id),
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
          id: tx.category_id ? Number(tx.category_id) : 0,
          name: tx.categories.name || '',
          is_system: false,
          created_at: tx.created_at
        }
      })
    }));
  }, [accountId, limit]); // Add accountId and limit to dependencies
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
      console.error('Error fetching transactions:', error);
      throw error;
    }

    console.log('Fetched transactions:', data);

    // Type assertion for the response data
    const transactions = data as unknown as TransactionRow[];

    return transactions.map(tx => ({
      id: Number(tx.id), // Ensure 'id' is number
      user_id: String(tx.user_id),
      account_id: tx.account_id == null ? null : Number(tx.account_id), // Ensure 'account_id' is number or null
      category_id: tx.category_id == null ? null : Number(tx.category_id), // Ensure 'category_id' is number or null
      amount: Number(tx.amount), // Ensure 'amount' is number
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
