'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { createClient } from '@/lib/supabase-client';
import { useCurrentUser } from '@/hooks/use-supabase-data';
import { PlusCircle } from 'lucide-react';
import type { Category } from '@/types/database';

export function TransactionDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  React.useEffect(() => {
    async function fetchCategories() {
      const supabase = await createClient();
      const { data } = await supabase.from('categories').select('*');
      if (data) {
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const supabase = await createClient();
      
      // Get current auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser?.id) {
        throw new Error('Please sign in to add transactions.');
      }

      // Get user's database ID
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
      
      if (dbError || !dbUser?.id) {
        console.error('Database error:', dbError);
        throw new Error('User profile not found. Please try signing out and in again.');
      }

      const amount = formData.is_income ? Number(formData.amount) : -Number(formData.amount);
      if (isNaN(amount)) throw new Error('Invalid amount');

      const data = {
        description: String(formData.description).trim(),
        amount: amount,
        category_id: formData.category_id,
        date: formData.transaction_date.toISOString().split('T')[0],
        user_id: dbUser.id,
        type: formData.is_income ? 'income' : 'expense',
        is_income: Boolean(formData.is_income)
      };

      // Log the data we're about to submit
      console.log('Submitting transaction with data:', JSON.stringify(data, null, 2));
      
      // Then insert the transaction
      const { data: result, error } = await supabase
        .from('transactions')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Transaction error:', error);
        if (error.code === 'PGRST301') {
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(error.message || 'Failed to add transaction');
      }

      console.log('Transaction added successfully:', result);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to add transaction:', error);
      alert(error.message || 'Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Add a new transaction to track your spending.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm 
          onSubmit={handleSubmit}
          categories={categories}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
