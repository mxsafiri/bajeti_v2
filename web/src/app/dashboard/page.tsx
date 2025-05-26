'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from './_components/overview';
import { RecentExpenses } from './_components/recent-expenses';
import { CategoryBreakdown } from './_components/category-breakdown';

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
}

interface CategoryBudget {
  category_id: string;
  categories: {
    name: string;
    color: string;
  };
  allocated_amount: number;
  expenses?: { amount: number }[];
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  allocated: number;
  spent: number;
  remaining: number;
}

interface CategoryData {
  name: string;
  total: number;
  color: string;
}

interface DashboardData {
  totalExpenses: number;
  totalBudget: number;
  recentExpenses: Expense[];
  categoryBreakdown: CategoryBreakdown[];
}

async function fetchDashboardData() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No session found');
  }

  const userId = session.user.id;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get current budget
  const { data: currentBudget } = await supabase
    .from('budgets')
    .select('id, amount')
    .eq('user_id', userId)
    .lte('start_date', now.toISOString())
    .gt('end_date', now.toISOString())
    .single();

  // Get recent expenses
  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select(`
      id,
      amount,
      description,
      date,
      category:categories (id, name, color, icon)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5) as { data: Expense[] | null };

  // Get category breakdown
  const { data: categories } = await supabase
    .from('category_budgets')
    .select(`
      category_id,
      categories (name, color),
      allocated_amount,
      expenses:expenses (amount)
    `)
    .eq('user_id', userId)
    .eq('budget_id', currentBudget?.id)
    .order('allocated_amount', { ascending: false });

  // Calculate total expenses for the current month
  const { data: monthlyExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('date', firstDayOfMonth.toISOString())
    .lte('date', lastDayOfMonth.toISOString());

  const totalExpenses = monthlyExpenses?.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0) || 0;

  const categoryBreakdown = (categories as CategoryBudget[] | null)?.map(category => ({
    categoryId: category.category_id,
    categoryName: category.categories.name,
    categoryColor: category.categories.color,
    allocated: category.allocated_amount,
    spent: category.expenses?.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0) || 0,
    remaining: category.allocated_amount - (category.expenses?.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0) || 0)
  })) || [];

  return {
    totalExpenses,
    totalBudget: currentBudget?.amount || 0,
    recentExpenses: recentExpenses || [],
    categoryBreakdown
  };
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

  // Transform data for Overview component
  const categoryData = data.categoryBreakdown.map((category): CategoryData => ({
    name: category.categoryName,
    total: category.spent,
    color: category.categoryColor
  }));

  return (
    <main className="flex flex-col gap-8">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.totalBudget.toLocaleString()}
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.totalBudget - data.totalExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((data.totalExpenses / data.totalBudget) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of budget used
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="space-y-4">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Overview data={categoryData} />
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Your spending overview for this month
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  Your latest transactions with details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentExpenses expenses={data.recentExpenses} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                  Your spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown categories={categoryData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
