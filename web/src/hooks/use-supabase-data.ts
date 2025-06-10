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
  
  return user.id;
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
    const hookName = fetchFn.name || 'anonymousFetchFn'; // Get name of the function for logging
    console.log(`[Debug] useFetchData (${hookName}): Starting fetch.`);
    try {
      setIsLoading(true);
      setError(null);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.error(`[Debug] useFetchData (${hookName}): Fetch timed out after 15 seconds.`);
          reject(new Error('Data fetching timed out after 15 seconds'));
        }, 15000)
      );

      // Race the actual fetch function against the timeout
      const result = await Promise.race([fetchFn(), timeoutPromise]);
      
      // Only update state if the component is still mounted
      if (isMounted) {
        console.log(`[Debug] useFetchData (${hookName}): Fetch successful, data:`, result);
        setData(result as T);
      } else {
        console.log(`[Debug] useFetchData (${hookName}): Fetch successful but component unmounted.`);
      }
    } catch (err) {
      if (isMounted) {
        console.error(`[Debug] useFetchData (${hookName}): Error during fetch:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } else {
        console.error(`[Debug] useFetchData (${hookName}): Error during fetch but component unmounted:`, err);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
        console.log(`[Debug] useFetchData (${hookName}): Fetch finished, isLoading set to false.`);
      } else {
        console.log(`[Debug] useFetchData (${hookName}): Fetch finished but component unmounted, isLoading not changed.`);
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
    // First get the authenticated user from Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return null;
    }

    if (!authUser) {
      console.log('No authenticated user found');
      return null;
    }

    // Then get the user's profile from the users table
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id) // Use auth_id which is the UUID from auth.users
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // If no user profile exists, this might be a first-time login
      if (dbError.code === 'PGRST116') {
        console.warn(`No user profile found for auth_id: ${authUser.id}`);
        return null;
      }
      throw dbError;
    }

    return userData;
  });
}

// Hook: Fetch all categories for the current user
export function useCategories() {
  return useFetchData<Category[]>(async () => {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*');
      // .eq('user_id', userId); // Temporarily removed due to categories.user_id being an INT (old system) and userId being UUID

    if (error) throw error;
    return data || [];
  });
}

// Type for category spending data
// Explicitly defined because Database['public']['Functions']['get_category_spending'] is not available in generated types.
// Consider regenerating database types if 'get_category_spending' is a valid RPC.
interface CategorySpending {
  category_id: string | number | null; // from view: c.id (INT)
  category_name: string | null;      // from view: c.name (TEXT)
  auth_user_id?: string | null;     // from view: t.user_id (UUID) - if needed by client
  total_spent?: number | null;       // from view: SUM(t.amount) (NUMERIC)
  transaction_count?: number | null; // from view: COUNT(t.id) (BIGINT)
  // percentage_used and budget_amount are NOT directly in this view.
  // They would need to come from budget data if this interface is shared.
}

// Hook: Fetch category spending data
export function useCategorySpending() {
  return useFetchData<CategorySpending[]>(async function useCategorySpendingInternal() { // Named for clarity
    const userId = await getCurrentUserId(); // UUID from public.users.id
    console.log('[Debug] useCategorySpending: Using userId (auth_user_id from view):', userId);
    
    // Querying the new view instead of RPC
    const { data, error } = await supabase
      .from('category_spending_by_auth_user') // New view name
      .select('*')
      .eq('auth_user_id', userId); // Filter by the UUID user_id from the view

    if (error) {
      console.error('[Debug] useCategorySpending: Error fetching from view "category_spending_by_auth_user":', error);
      throw error;
    }
    console.log('[Debug] useCategorySpending: Data from view:', data);
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
      // Fetch data from the category_spending_by_auth_user view
      const currentAuthUserId = await getCurrentUserId();
      console.log('[Debug] useBudgetSummary: Fetching from category_spending_by_auth_user for user:', currentAuthUserId);
      const { data: spendingData, error: spendingError } = await supabase
        .from('category_spending_by_auth_user')
        .select('category_name, total_spent') // Only select what's needed
        .eq('auth_user_id', currentAuthUserId);

      if (spendingError) {
        console.error('[Debug] useBudgetSummary: Error fetching spendingData:', spendingError);
        throw spendingError;
      }
      
      const typedSpendingData = (spendingData || []) as Pick<CategorySpending, 'category_name' | 'total_spent'>[];
      console.log('[Debug] useBudgetSummary: spendingData from view:', typedSpendingData);

      // TODO: Fetch actual budget total for this budgetId
      const budgetTotal = 1000; // Placeholder - this needs to come from the specific budget

      const categoriesSummary = typedSpendingData.map(cat => ({
        name: cat.category_name || 'Uncategorized',
        amount: Number(cat.total_spent) || 0,
        // Percentage calculation needs the actual budget total for this category or overall budget
        percentage: budgetTotal > 0 ? ((Number(cat.total_spent) || 0) / budgetTotal * 100) : 0 // Placeholder percentage
      }));
      
      const totalSpent = categoriesSummary.reduce((sum, cat) => sum + cat.amount, 0);
      
      return {
        total: budgetTotal,
        used: totalSpent,
        remaining: Math.max(0, budgetTotal - totalSpent),
        categories: categoriesSummary
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
          color: '#808080', // Default gray color for categories without color
          is_system: false,
          created_at: tx.created_at
        }
      })
    }));
  }, [accountId, limit]); // Add accountId and limit to dependencies
}


export function useTransactions(limit = 100) {
  return useFetchData<DbTransaction[]>(async function useTransactionsInternal(): Promise<DbTransaction[]> {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('transactions_with_category_names')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(item => ({
      id: Number(item.id),
      user_id: String(item.user_id),
      account_id: item.account_id == null ? null : Number(item.account_id),
      category_id: item.category_id == null ? null : Number(item.category_id),
      amount: Number(item.amount),
      date: item.date,
      description: item.description || null,
      is_income: item.is_income,
      receipt_url: item.receipt_url || null,
      type: item.type || null,
      created_at: item.created_at,
      updated_at: item.updated_at || null,
      notes: item.notes || null,
      frequency: item.frequency || null,
      categories: item.category_name ? {
        id: Number(item.category_id) || 0,
        name: item.category_name,
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Generate random color for now
        is_system: false,
        created_at: item.created_at
      } : undefined
    })) as DbTransaction[];
  }, [limit]);
}
