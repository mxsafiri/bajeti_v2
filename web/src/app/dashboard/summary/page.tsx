'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Mock data for demonstration
const mockSummaryData = {
  totalIncome: 15000000,
  totalExpenses: 8500000,
  savingsRate: 43,
  topCategories: [
    { name: 'Housing', amount: 3000000, percentage: 35 },
    { name: 'Food', amount: 2000000, percentage: 24 },
    { name: 'Transportation', amount: 1500000, percentage: 18 },
    { name: 'Entertainment', amount: 1000000, percentage: 12 },
    { name: 'Others', amount: 1000000, percentage: 11 },
  ],
  monthlyTrend: [
    { month: 'Jan', income: 14000000, expenses: 8000000 },
    { month: 'Feb', income: 14500000, expenses: 8200000 },
    { month: 'Mar', income: 14800000, expenses: 8300000 },
    { month: 'Apr', income: 15000000, expenses: 8400000 },
    { month: 'May', income: 15000000, expenses: 8500000 },
  ],
  budgetStatus: {
    total: 10000000,
    used: 8500000,
    remaining: 1500000,
    percentage: 85
  }
};

export default function SummaryPage() {
  const [summaryData, setSummaryData] = useState(mockSummaryData);
  const [timeframe, setTimeframe] = useState('month');
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate net savings
  const netSavings = summaryData.totalIncome - summaryData.totalExpenses;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Summary</h1>
          <p className="text-sm text-gray-500">Overview of your financial health</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Tabs defaultValue={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalIncome)}</div>
            <p className="text-xs text-green-500 mt-1">+5% from previous {timeframe}</p>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-gray-500">Last updated: {format(new Date(), 'dd MMM yyyy')}</p>
          </CardFooter>
        </Card>
        
        {/* Expenses card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalExpenses)}</div>
            <p className="text-xs text-red-500 mt-1">+3% from previous {timeframe}</p>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-gray-500">Last updated: {format(new Date(), 'dd MMM yyyy')}</p>
          </CardFooter>
        </Card>
        
        {/* Savings card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netSavings)}</div>
            <p className="text-xs text-blue-500 mt-1">Savings rate: {summaryData.savingsRate}%</p>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-gray-500">Last updated: {format(new Date(), 'dd MMM yyyy')}</p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Budget status */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Status</CardTitle>
          <CardDescription>
            {timeframe === 'month' ? 'Monthly' : timeframe === 'week' ? 'Weekly' : 'Yearly'} budget progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Budget Used</span>
              <span className="font-medium">{summaryData.budgetStatus.percentage}%</span>
            </div>
            <Progress value={summaryData.budgetStatus.percentage} />
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-500">Used</p>
                <p className="font-medium">{formatCurrency(summaryData.budgetStatus.used)}</p>
              </div>
              <div>
                <p className="text-gray-500">Remaining</p>
                <p className="font-medium">{formatCurrency(summaryData.budgetStatus.remaining)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium">{formatCurrency(summaryData.budgetStatus.total)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Expense breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>Top spending categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryData.topCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{category.name}</span>
                  <span className="font-medium">{formatCurrency(category.amount)} ({category.percentage}%)</span>
                </div>
                <Progress value={category.percentage} className={`h-2 ${
                  index === 0 ? 'bg-blue-100' : 
                  index === 1 ? 'bg-green-100' : 
                  index === 2 ? 'bg-yellow-100' : 
                  index === 3 ? 'bg-purple-100' : 'bg-gray-100'
                }`} />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center text-sm text-blue-600">
            <span>View detailed breakdown</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
      
      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Income vs Expenses over time</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="mx-auto h-16 w-16 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Chart visualization would appear here
            </p>
            <p className="text-xs text-gray-400">
              Showing data for the last 5 months
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Spending insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spending Insights</CardTitle>
            <CardDescription>Unusual spending patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Dining expenses increased</p>
                  <p className="text-sm text-gray-500">Your dining expenses are 20% higher than last month</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Transportation costs reduced</p>
                  <p className="text-sm text-gray-500">You spent 15% less on transportation this month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>Bills due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Electricity Bill</p>
                    <p className="text-sm text-gray-500">Due in 2 days</p>
                  </div>
                </div>
                <p className="font-medium">{formatCurrency(750000)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Internet Subscription</p>
                    <p className="text-sm text-gray-500">Due in 5 days</p>
                  </div>
                </div>
                <p className="font-medium">{formatCurrency(450000)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
          <CardDescription>Based on your spending habits, savings, and debt</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold">78</div>
                <div className="text-sm text-gray-500">Good</div>
              </div>
            </div>
            <PieChart className="h-40 w-40 text-emerald-500 opacity-20" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium">Savings</div>
              <div className="text-lg font-bold text-emerald-500">85</div>
            </div>
            <div>
              <div className="text-sm font-medium">Spending</div>
              <div className="text-lg font-bold text-amber-500">72</div>
            </div>
            <div>
              <div className="text-sm font-medium">Debt</div>
              <div className="text-lg font-bold text-blue-500">78</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="flex items-center text-sm text-blue-600">
            <span>View detailed report</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
