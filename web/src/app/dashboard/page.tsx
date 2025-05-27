'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionDialog } from './_components/transaction-dialog';
import { BudgetDialog } from './_components/budget-dialog';
import { Overview } from './_components/overview';
import { RecentExpenses } from './_components/recent-expenses';
import { CategoryBreakdown } from './_components/category-breakdown';
import type { Transaction, Category, Budget, BudgetCategory } from '@/types/database';

interface DashboardTransaction {
  id: number;
  amount: number;
  description: string | null;
  date: string;
  category_id: number;
  categories: {
    id: number;
    name: string;
    color: string;
  };
}

interface DashboardCategoryBudget {
  id: number;
  category_id: number;
  amount: number;
  categories: {
    id: number;
    name: string;
    color: string;
  };
  transactions: { amount: number }[];
}

interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  allocated: number;
  spent: number;
  remaining: number;
}

interface DashboardData {
  totalExpenses: number;
  totalBudget: number;
  recentExpenses: {
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
  categoryBreakdown: CategoryBreakdownItem[];
}

async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No session found');
    }

    const userId = session.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get current budget
    const { data: budget } = await supabase
      .from('budgets')
      .select('id, needs_percentage, wants_percentage, savings_percentage')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    // Get recent transactions with categories
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        description,
        date,
        category_id,
        categories (id, name, color)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5) as { data: DashboardTransaction[] | null };

    // Get category budgets with transactions
    const { data: categoryBudgets } = await supabase
      .from('category_budgets')
      .select(`
        id,
        category_id,
        amount,
        categories (id, name, color),
        transactions (amount)
    `)
    .eq('user_id', userId)
    .eq('budget_id', budget?.id) as { data: DashboardCategoryBudget[] | null };

    // Calculate totals
    const totalBudget = budget ? 100 : 0; // 100% total
    const totalExpenses = categoryBudgets?.reduce((sum: number, cat: DashboardCategoryBudget) => {
      return sum + (cat.transactions?.reduce((total: number, tx: { amount: number }) => total + tx.amount, 0) || 0);
    }, 0) || 0;

    // Transform category data
    const categoryBreakdown = categoryBudgets?.map((cat: DashboardCategoryBudget): CategoryBreakdownItem => ({
      categoryId: cat.category_id,
      categoryName: cat.categories.name,
      categoryColor: cat.categories.color,
      allocated: cat.amount,
      spent: cat.transactions?.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0) || 0,
      remaining: cat.amount - (cat.transactions?.reduce((sum: number, tx: { amount: number }) => sum + tx.amount, 0) || 0)
    })) || [];

    return {
      totalExpenses,
      totalBudget,
      recentExpenses: transactions?.map((tx: DashboardTransaction) => ({
        id: tx.id,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        category: {
          id: tx.categories.id,
          name: tx.categories.name,
          color: tx.categories.color
        }
      })) || [],
      categoryBreakdown: categoryBreakdown
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      totalExpenses: 0,
      totalBudget: 0,
      recentExpenses: [],
      categoryBreakdown: []
    };
  }
}

export default function DashboardPage(): React.ReactElement {
  const [data, setData] = React.useState<DashboardData | null>(null);

  React.useEffect(() => {
    async function loadData() {
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
    }
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }



  return (
    <main className="flex flex-col gap-8">
      <div className="flex justify-end">
        <TransactionDialog />
      </div>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalBudget}%
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
              ${data.totalExpenses.toLocaleString()}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Overview</CardTitle>
                  <BudgetDialog />
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={data.categoryBreakdown} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      You have made {data.recentExpenses.length} transactions this month.
                    </CardDescription>
                  </div>
                  <TransactionDialog />
                </div>
              </CardHeader>
              <CardContent>
                <RecentExpenses expenses={data.recentExpenses} />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <CategoryBreakdown data={data.categoryBreakdown} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
