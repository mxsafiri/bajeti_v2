'use client';

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

import type { Transaction, Category } from '@/types/database';

interface RecentExpensesProps {
  expenses: {
    id: number;
    amount: number;
    description: string | null;
    date: string;
    category: {
      id: number;
      name: string;
      color: string;
    };
  }[];
  showMore?: boolean;
}

export function RecentExpenses({ expenses, showMore = false }: RecentExpensesProps) {
  return (
    <div className="space-y-8">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center">
          <Avatar className="h-9 w-9" style={{ backgroundColor: expense.category.color }}>
            <span className="text-xs font-medium">
              {expense.category.name.slice(0, 2).toUpperCase()}
            </span>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{expense.description}</p>
            <p className="text-sm text-muted-foreground">
              {expense.category.name} • {formatDistanceToNow(new Date(expense.date), { addSuffix: true })}
            </p>
          </div>
          <div className="ml-auto font-medium">
            ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      ))}
      {showMore && expenses.length > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = '/dashboard/expenses'}
        >
          View All Expenses
        </Button>
      )}
      {expenses.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent expenses
        </p>
      )}
    </div>
  );
}
