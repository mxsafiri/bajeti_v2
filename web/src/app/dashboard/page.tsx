'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from './_components/overview';
import { RecentExpenses } from './_components/recent-expenses';
import { CategoryBreakdown } from './_components/category-breakdown';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/use-toast';

interface DashboardData {
  totalExpenses: number;
  totalBudget: number;
  recentExpenses: any[];
  categoryBreakdown: any[];
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalExpenses: 0,
    totalBudget: 0,
    recentExpenses: [],
    categoryBreakdown: []
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;

        // Get total expenses for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', startOfMonth.toISOString());

        if (expensesError) throw expensesError;

        const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

        // Get current budget
        const { data: budgets, error: budgetsError } = await supabase
          .from('budgets')
          .select('amount')
          .eq('user_id', user.id)
          .eq('period', 'monthly')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (budgetsError && budgetsError.code !== 'PGRST116') throw budgetsError;

        // Get recent expenses
        const { data: recentExpenses, error: recentError } = await supabase
          .from('expenses')
          .select('*, category:categories(name, color)')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        // Get category breakdown
        const { data: categoryBreakdown, error: categoryError } = await supabase
          .from('categories')
          .select('name, color, expenses:expenses(amount)')
          .eq('user_id', user.id)
          .eq('expenses.user_id', user.id)
          .gte('expenses.date', startOfMonth.toISOString());

        if (categoryError) throw categoryError;

        setData({
          totalExpenses,
          totalBudget: budgets?.amount || 0,
          recentExpenses: recentExpenses || [],
          categoryBreakdown: categoryBreakdown?.map(cat => ({
            name: cat.name,
            color: cat.color,
            total: cat.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
          })) || []
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Here's an overview of your finances
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data.totalExpenses.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  For this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data.totalBudget.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.totalExpenses > data.totalBudget ? 'Over budget' : 'Within budget'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Remaining Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(data.totalBudget - data.totalExpenses).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((data.totalBudget - data.totalExpenses) / data.totalBudget * 100).toFixed(1)}% remaining
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={data.categoryBreakdown} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  Your latest transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentExpenses expenses={data.recentExpenses} />
              </CardContent>
            </Card>
          </div>
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
              <RecentExpenses expenses={data.recentExpenses} showMore />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                Your expense breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBreakdown categories={data.categoryBreakdown} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
