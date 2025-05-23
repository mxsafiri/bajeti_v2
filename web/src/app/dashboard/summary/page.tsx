"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { format, parseISO, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ArrowRight, XCircle, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  useCurrentUser, 
  useTransactions, 
  useCurrentBudget, 
  useCategorySpending, 
  useBudgetSummary
} from "@/hooks/use-supabase-data";

// Define FetchDataResult type since it's used in multiple places
type FetchDataResult<T> = {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
};
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie } from "recharts";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

import type { Database } from '@/lib/database.types';
import type { CategorySpending, Transaction as DbTransaction } from '@/types/database';

// Define types for our hooks
type BudgetData = { total: number; id: number };
type TransactionsData = Transaction[];
// Removed local alias type CategorySpendingData = CategorySpending[];
// We will rely on the imported CategorySpending type directly.

type Transaction = Database['public']['Tables']['transactions']['Row'];

type TimeframeType = "week" | "month" | "year";

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  color?: string;
}

interface SummaryData {
  income: number;
  expenses: number;
  savingsRate: number;
  budgetStatus: {
    total: number;
    used: number;
    remaining: number;
  };
  monthlyTrends: Array<{
    date: string;
    income: number;
    expenses: number;
  }>;
  topCategories: SpendingCategory[];
}

// Removed conflicting local interface CategorySpending.
// The imported CategorySpending from '@/types/database' (which includes user_id, etc.)
// should now be correctly resolved and used.

interface BudgetSummary {
  total: number;
  used: number;
  remaining: number;
  categories: SpendingCategory[];
}

// Helper function to get date range based on timeframe
function getDateRange(timeframe: TimeframeType): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (timeframe) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return { start, end };
}

// Custom hook to get filtered transactions based on timeframe
const useFilteredTransactions = (timeframe: TimeframeType) => {
  const { data: allTransactions, ...rest } = useTransactions(1000);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    if (!allTransactions) return;
    
    const dateRange = getDateRange(timeframe);
    const startDate = dateRange.start;
    const endDate = dateRange.end;
    
    const filtered = allTransactions.filter(transaction => {
      if (!transaction.date) return false;
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    setFilteredTransactions(filtered);
  }, [allTransactions, timeframe]);
  
  return {
    ...rest,
    data: filteredTransactions,
    refetch: rest.refetch
  };
};

export default function SummaryPage() {
  const [timeframe, setTimeframe] = useState<TimeframeType>("month");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user data
  const { data: user, error: userError, isLoading: isUserLoading, refetch: refetchUser } = useCurrentUser();
  
  // Fetch transactions with proper typing
  const transactionsResult = useTransactions(100);
  const transactions = transactionsResult?.data || [];
  const isLoadingTransactions = transactionsResult?.isLoading || false;
  const transactionsError = transactionsResult?.error;
  const refetchTransactions = transactionsResult?.refetch;
  
  // Fetch current budget with proper typing
  const budgetResult = useCurrentBudget() as unknown as FetchDataResult<BudgetData>;
  const budget = budgetResult?.data || null;
  const isLoadingBudget = budgetResult?.isLoading || false;
  const budgetError = budgetResult?.error;
  const refetchBudget = budgetResult?.refetch;
  
  // Fetch category spending with proper typing
  const categorySpendingResult = useCategorySpending();
  const categorySpending = categorySpendingResult?.data || [];
  const isCategoryLoading = categorySpendingResult?.isLoading || false;
  const categoryError = categorySpendingResult?.error;
  const refetchCategorySpending = categorySpendingResult?.refetch;
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Handle loading state
  const isLoadingState = !user || !transactions || !budget;
  
  // Handle errors
  const hasErrorState = Boolean(userError || transactionsError || budgetError);
  const errorMessageState = userError?.message || transactionsError?.message || budgetError?.message || 'An error occurred';

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchUser?.() || Promise.resolve(),
        refetchTransactions?.() || Promise.resolve(),
        refetchBudget?.() || Promise.resolve(),
        refetchCategorySpending?.() || Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setErrorMessage('Failed to refresh data');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoadingState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading your financial summary...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasErrorState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4 mx-auto w-fit">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{errorMessageState}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to format currency
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null) return '-';
    // Default to TZS since currency is not in the user type
    const currency = 'TZS';
    return new Intl.NumberFormat(currency === 'TZS' ? 'en-TZ' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate summary data from transactions and budget
  const calculateSummaryData = useCallback((transactions: Transaction[], budget: BudgetData | null, categorySpending: CategorySpending[]): SummaryData => {
    // Calculate total income and expenses
    const { totalIncome, totalExpenses } = transactions.reduce(
      (acc: { totalIncome: number; totalExpenses: number }, transaction: Transaction) => {
        if (transaction.is_income) {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpenses += transaction.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Transform category spending data
    // Define a type for the intermediate structure produced by this first transformation
    interface IntermediateCategoryData {
      name: string; // Corresponds to category_name
      amount: number; // Corresponds to total_spent
      percentage: number; // From percentage_used
      total_spent: number | null | undefined; // Raw total_spent
      category_name: string | null | undefined; // Raw category_name
      category_id: number | string | null | undefined; // Raw category_id
      budget_amount: number | null | undefined; // Raw budget_amount
    }

    const transformedCategorySpending: IntermediateCategoryData[] =
      (categorySpending || []).map((cat: any) => { // Assuming 'cat' from hook has these props
        return {
          name: cat.category_name || 'Uncategorized',
          amount: cat.total_spent || 0,
          percentage: cat.percentage_used || 0, // This property is fine for IntermediateCategoryData
          total_spent: cat.total_spent,
          category_name: cat.category_name,
          category_id: cat.category_id,
          budget_amount: cat.budget_amount // This property is fine for IntermediateCategoryData
        };
      });

    const topSpendingCategories = transformedCategorySpending
      .map(category => ({
        name: category.name,
        amount: category.amount,
        percentage: category.percentage,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const monthlyTrends = transactions
      .filter((t): t is Transaction & { date: string } => Boolean(t.date))
      .map(t => ({
        date: format(new Date(t.date), 'MMM yyyy'),
        income: t.is_income ? t.amount : 0,
        expenses: t.is_income ? 0 : t.amount
      }))
      .reduce<Array<{ date: string; income: number; expenses: number }>>((acc, current) => {
        const existing = acc.find(item => item.date === current.date);
        if (existing) {
          existing.income += current.income;
          existing.expenses += current.expenses;
        } else {
          acc.push(current);
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      income: totalIncome,
      expenses: totalExpenses,
      savingsRate,
      budgetStatus: {
        total: budget?.total || 0,
        used: totalExpenses,
        remaining: (budget?.total || 0) - totalExpenses
      },
      monthlyTrends,
      topCategories: topSpendingCategories
    };
  }, []);

  // Process data when it's available
  useEffect(() => {
    const processData = async () => {
      if (isUserLoading === true || isLoadingTransactions === true || isCategoryLoading === true || isLoadingBudget === true) {
        setIsLoading(true);
        return;
      }

      if (userError || transactionsError || budgetError || categoryError) {
        setHasError(true);
        setErrorMessage(userError?.message || transactionsError?.message || budgetError?.message || categoryError?.message || 'An error occurred');
        return;
      }

      // Process transactions if available
      if (Array.isArray(transactions) && transactions.length > 0 && budget && Array.isArray(categorySpending)) {
        try {
          // Transform category spending data before passing to calculateSummaryData
          const transformedCategorySpending = (categorySpending || [])
            // The .map() was broken by the previous incorrect placement of InputCategoryData.
            // Assuming 'categorySpending' (from the hook) is an array of objects with at least
            // category_id, category_name, total_spent, budget_amount.
            // We'll define InputCategoryData at a higher scope if still needed, or infer 'cat'.
            // For now, let's try to let TypeScript infer 'cat' or use 'any' temporarily
            // if the hook doesn't provide a strong type for its elements.
            .map((cat: any) => { // Temporarily using 'any' for 'cat' to fix syntax errors first
              let numericCategoryId: number;
              if (typeof cat.category_id === 'number') {
                numericCategoryId = cat.category_id;
              } else if (typeof cat.category_id === 'string') {
                const parsedId = parseInt(cat.category_id, 10);
                if (isNaN(parsedId)) {
                  console.warn('Invalid category_id (NaN):', cat.category_id, 'for category:', cat.category_name);
                  return null;
                }
                numericCategoryId = parsedId;
              } else { // cat.category_id is null or undefined
                console.warn('Null or undefined category_id for category:', cat.category_name);
                return null;
              }

              // Filter transactions for the current category
              // Ensure `transactions` is an array of Transaction objects
              const categoryTransactions = (transactions || []).filter(
                (t: DbTransaction) => t.category_id === numericCategoryId
              );
              const transaction_count = categoryTransactions.length;

              let first_transaction_date: string;
              let last_transaction_date: string;

              if (transaction_count === 0) {
                // If total_spent is reported but no transactions, it's an inconsistency or just an empty category.
                // For CategorySpending type, first/last transaction dates are required if there's spending.
                // We will filter out categories with no transactions to ensure type correctness.
                if (cat.total_spent && cat.total_spent > 0) {
                  console.warn(
                    `Category "${cat.category_name}" (ID: ${numericCategoryId}) has total_spent > 0 but no transactions. Skipping.`
                  );
                }
                return null;
              } else {
                // Sort by date to find first and last transaction dates
                categoryTransactions.sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                first_transaction_date = categoryTransactions[0].date;
                last_transaction_date = categoryTransactions[transaction_count - 1].date;
              }

              // Get user_id - assuming `user` object is available in the component scope
              // (e.g., from `useUser()` hook) and has an `id` property.
              const currentUserId = user?.id;
              if (!currentUserId) {
                console.warn('User ID not available. Skipping category spending record for category:', cat.category_name);
                return null;
              }

              // Explicitly build the object that should conform to CategorySpending
              const dataForChart: CategorySpending = {} as CategorySpending; // Start with an empty typed object
              dataForChart.category_id = numericCategoryId;
              dataForChart.category_name = cat.category_name || 'Uncategorized';
              dataForChart.user_id = currentUserId; // This is the problematic line
              dataForChart.total_spent = cat.total_spent || 0;
              dataForChart.transaction_count = transaction_count;
              dataForChart.first_transaction_date = first_transaction_date;
              dataForChart.last_transaction_date = last_transaction_date;
              dataForChart.budget = (cat.budget_amount === null || cat.budget_amount === undefined)
                                      ? undefined
                                      : cat.budget_amount;
              
              return dataForChart;
            })
            .filter((item): item is CategorySpending => item !== null);
          
          const summaryResult = calculateSummaryData(transactions, budget, transformedCategorySpending);
          setSummaryData(summaryResult);
          setIsLoading(false);
        } catch (error) {
          console.error('Error processing financial data:', error);
          setHasError(true);
          setErrorMessage('Error processing your financial data');
        }
      } else {
        // No transactions available
        setIsLoading(false);
      }
    };

    processData();
  }, [transactions, budget, categorySpending, isUserLoading, isLoadingTransactions, isCategoryLoading, isLoadingBudget, userError, transactionsError, budgetError, categoryError, calculateSummaryData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Loading...</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-24 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-24 mt-2 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="bg-red-100 p-3 rounded-full">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold">Failed to Load Data</h2>
        <p className="text-gray-500">{errorMessage}</p>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }

  // Render empty state
  if (!summaryData || !transactions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-muted p-4 rounded-full mb-4">
          <PieChart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No financial data yet</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Start by logging your income and expenses to see your financial summary
        </p>
        <Link
          href="/dashboard/transactions/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Add Transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData.income || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(summaryData.expenses || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {summaryData.savingsRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Status</CardTitle>
          <CardDescription>
            Track your spending against your monthly budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Monthly Budget</span>
              <span>{formatCurrency(summaryData.budgetStatus.total)}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Spent</span>
                <span>{formatCurrency(summaryData.budgetStatus.used)}</span>
              </div>
              <Progress
                value={(summaryData.budgetStatus.used / summaryData.budgetStatus.total) * 100}
                className="h-2"
                style={{
                  backgroundColor: summaryData.budgetStatus.used > summaryData.budgetStatus.total ? "rgb(239 68 68)" : undefined
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Remaining</span>
              <span className={summaryData.budgetStatus.remaining < 0 ? 'text-destructive' : 'text-primary'}>
                {formatCurrency(Math.abs(summaryData.budgetStatus.remaining))}
                {summaryData.budgetStatus.remaining < 0 ? ' over budget' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryData.topCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No spending data available for this period
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {summaryData.topCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{category.name}</span>
                    <span>{formatCurrency(category.amount)}</span>
                  </div>
                  <Progress value={category.percentage} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>
            Compare your income and expenses over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summaryData.monthlyTrends.length ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No trend data available for this period
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={summaryData.monthlyTrends.map((item, index) => ({
                  name: item.date,
                  income: item.income,
                  expenses: item.expenses,
                }))}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: string) => format(new Date(label), 'MMMM yyyy')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
