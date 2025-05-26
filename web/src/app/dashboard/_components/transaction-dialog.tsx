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

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('transactions').insert([data]);
      if (error) throw error;
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
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
