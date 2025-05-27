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
import { PlusCircle } from 'lucide-react';
import type { Category } from '@/types/database';

export function TransactionDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);

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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const amount = formData.is_income ? Number(formData.amount) : -Number(formData.amount);
      if (isNaN(amount)) throw new Error('Invalid amount');
      
      const data = {
        description: String(formData.description).trim(),
        amount: amount,
        category_id: parseInt(formData.category_id),
        date: new Date().toISOString(), // Use current timestamp
        user_id: user.id,
        type: formData.is_income ? 'income' : 'expense',
        is_income: Boolean(formData.is_income)
      };

      console.log('Submitting transaction data:', JSON.stringify(data, null, 2));
      
      // First verify the user exists
      const { data: userCheck } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (!userCheck) {
        throw new Error('User not found in database');
      }
      
      // Then insert the transaction
      const { data: result, error } = await supabase
        .from('transactions')
        .insert([data])
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (!result) {
        throw new Error('No data returned after insert');
      }
      
      console.log('Transaction created successfully:', result);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setIsOpen(false);
      window.location.reload(); // Refresh to show new data
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
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
