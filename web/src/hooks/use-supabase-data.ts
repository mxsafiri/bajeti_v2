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
  console.log('[Debug] getCurrentUserId: Attempting to get auth user...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('[Debug] getCurrentUserId: Auth error or no user.', authError);
    throw new Error('No authenticated user');
  }
  console.log('[Debug] getCurrentUserId: Auth user obtained:', user.id);
  
  console.log('[Debug] getCurrentUserId: Attempting to fetch user data from "users" table for auth_id:', user.id);
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id) // Assuming users.auth_id is UUID and matches auth.users.id
    .single();

  if (userError || !userData) {
    console.error('[Debug] getCurrentUserId: Error fetching user data from "users" table or no data found.', userError);
    throw new Error('Failed to fetch user data from "users" table or no data found for this auth_id.');
  }
  
  console.log('[Debug] getCurrentUserId: User data from "users" table obtained, internal ID:', userData.id);
  return userData.id; // This should be the UUID from public.users.id
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
          is_system: false,
          created_at: tx.created_at
        }
      })
    }));
  }, [accountId, limit]); // Add accountId and limit to dependencies
}


export function useTransactions(limit = 100) {
  return useFetchData<DbTransaction[]>(async function useTransactionsInternal(): Promise<DbTransaction[]> { // Named the async function
    console.log('[Debug] useTransactions: Starting.');
    const userId = await getCurrentUserId();
    console.log('[Debug] useTransactions: Obtained internal userId:', userId, 'for limit:', limit);

    // Query transactions using the internal user ID
    console.log('[Debug] useTransactions: Querying "transactions_with_category_names" view...');
    const { data, error } = await supabase
      .from('transactions_with_category_names') // Query the new view
      .select('*') // Select all columns from the view (includes category_name)
      .eq('user_id', userId) // This user_id is from the view, originating from transactions.user_id (UUID)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Debug] useTransactions: Error fetching from "transactions_with_category_names" view:', error);
      throw error;
    }

    console.log('[Debug] useTransactions: Successfully fetched data from view:', data);

    // Data from the view is flat. Each item in 'data' will have transaction fields + category_name.
    // Ensure your DbTransaction type can handle this structure, or adjust the mapping.
    // Also ensure the view 'transactions_with_category_names' selects all fields needed below (e.g., account_id, updated_at, notes, frequency).
    return (data || []).map(itemFromView => {
      const mappedItem: any = { // Using 'any' for the intermediate mapped item for flexibility.
        id: Number(itemFromView.id),
        user_id: String(itemFromView.user_id), // transactions.user_id is UUID
        account_id: itemFromView.account_id == null ? null : Number(itemFromView.account_id),
        category_id: itemFromView.category_id == null ? null : Number(itemFromView.category_id),
        amount: Number(itemFromView.amount),
        date: itemFromView.date,
        description: itemFromView.description || null,
        is_income: itemFromView.is_income,
        receipt_url: itemFromView.receipt_url || null,
        type: itemFromView.type || null,
        created_at: itemFromView.created_at,
        updated_at: itemFromView.updated_at || null,
        notes: itemFromView.notes || null,
        frequency: itemFromView.frequency || null
      };

      if (itemFromView.category_name) {
        mappedItem.categories = {
          id: itemFromView.category_id ? Number(itemFromView.category_id) : 0,
          name: itemFromView.category_name,
          is_system: false, // Placeholder: view doesn't provide this for category
          created_at: itemFromView.created_at // Placeholder: using transaction's created_at
        };
      } else {
        // If DbTransaction expects 'categories' to be potentially null or undefined
        mappedItem.categories = null;
      }
      return mappedItem;
    }) as DbTransaction[]; // Cast the final array to DbTransaction[]
  }, [limit]);
}
