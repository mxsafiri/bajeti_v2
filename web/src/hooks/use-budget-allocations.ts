import { useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

type BudgetAllocation = Database['public']['Tables']['budget_categories']['Row'];
type NewBudgetAllocation = Database['public']['Tables']['budget_categories']['Insert'];

export function useBudgetAllocations() {
  const supabase = createClientComponentClient<Database>();

  const createBudgetAllocation = useCallback(
    async (allocation: NewBudgetAllocation) => {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert(allocation)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const getBudgetAllocations = useCallback(
    async (budgetId: number) => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*, categories(*)')
        .eq('budget_id', budgetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const getLatestBudgetAllocation = useCallback(
    async (budgetId: number) => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*, categories(*)')
        .eq('budget_id', budgetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') return null; // PGRST116 is "no rows returned"
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  return {
    createBudgetAllocation,
    getBudgetAllocations,
    getLatestBudgetAllocation,
  };
}
