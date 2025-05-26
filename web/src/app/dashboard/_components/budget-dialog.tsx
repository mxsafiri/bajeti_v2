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
import { BudgetForm } from '@/components/budgets/budget-form';
import { createClient } from '@/lib/supabase-client';
import { Settings } from 'lucide-react';

export function BudgetDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const supabase = await createClient();
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert([{
          month: data.month,
          year: data.year,
        }])
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Create budget allocation
      const { error: allocationError } = await supabase
        .from('budget_allocations')
        .insert([{
          budget_id: budget.id,
          needs_percentage: data.needs_percentage,
          wants_percentage: data.wants_percentage,
          savings_percentage: data.savings_percentage,
        }]);

      if (allocationError) throw allocationError;
      setIsOpen(false);
    } catch (error) {
      console.error('Error setting budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Settings className="mr-2 h-4 w-4" />
          Set Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Monthly Budget</DialogTitle>
          <DialogDescription>
            Set your budget allocations for needs, wants, and savings.
          </DialogDescription>
        </DialogHeader>
        <BudgetForm 
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
