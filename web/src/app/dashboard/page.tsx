'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionDialog } from './_components/transaction-dialog';
import { BudgetDialog } from './_components/budget-dialog';
import { Overview } from "./_components/overview";
import { RecentExpenses } from "./_components/recent-expenses";
import { CategoryBreakdown } from "./_components/category-breakdown";
import { useTransactions, useCurrentBudget, useCategorySpending } from '@/hooks/use-supabase-data';

interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export default function DashboardPage(): React.ReactElement {
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: currentBudget, isLoading: isLoadingBudget } = useCurrentBudget();
  const { data: categorySpending, isLoading: isLoadingSpending } = useCategorySpending();

  const isLoading = isLoadingTransactions || isLoadingBudget || isLoadingSpending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasNoData = !transactions?.length && !currentBudget;
  
  if (hasNoData) {
    return (
      <main className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome to Bajeti!</h1>
          <div className="flex gap-2">
            <BudgetDialog />
            <TransactionDialog />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Let's get started!</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            To begin tracking your finances, create a budget and add some transactions.
            Click the buttons above to get started.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>1. Create a Budget</CardTitle>
                <CardDescription>
                  Set up your monthly budget to track your spending against your goals.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>2. Add Transactions</CardTitle>
                <CardDescription>
                  Start recording your income and expenses to see where your money goes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  const totalExpenses = transactions?.reduce((sum, t) => !t.is_income ? sum + t.amount : sum, 0) || 0;
  const totalBudget = currentBudget?.amount || 0;
  const budgetPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  return (
    <main className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <BudgetDialog />
          <TransactionDialog />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={categorySpending?.map(cat => ({
                  categoryId: Number(cat.category_id),
                  categoryName: cat.category_name || 'Uncategorized',
                  categoryColor: '#' + Math.floor(Math.random()*16777215).toString(16),
                  allocated: currentBudget?.amount || 0,
                  spent: cat.total_spent || 0,
                  remaining: (currentBudget?.amount || 0) - (cat.total_spent || 0)
                })) || []} />
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  You have made {transactions?.length || 0} transactions this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentExpenses 
                  expenses={transactions?.map(t => ({
                    id: Number(t.id),
                    amount: t.amount,
                    description: t.description,
                    date: t.date,
                    category: {
                      id: Number(t.category_id),
                      name: t.categories?.name || 'Uncategorized',
                      color: '#' + Math.floor(Math.random()*16777215).toString(16)
                    }
                  })) || []} 
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <CategoryBreakdown data={categorySpending?.map(cat => ({
                  categoryId: Number(cat.category_id),
                  categoryName: cat.category_name || 'Uncategorized',
                  categoryColor: '#' + Math.floor(Math.random()*16777215).toString(16),
                  allocated: currentBudget?.amount || 0,
                  spent: cat.total_spent || 0,
                  remaining: (currentBudget?.amount || 0) - (cat.total_spent || 0)
                })) || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
