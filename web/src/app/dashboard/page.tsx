'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Home, 
  Car, 
  Utensils, 
  Smartphone,
  X,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Briefcase,
  Coffee,
  Gift,
  Zap,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  useTransactions, 
  useCategories, 
  useCategorySpending,
  useCurrentBudget,
  createTransaction
} from '@/hooks/use-supabase-data';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { CategorySpendingChart } from '@/components/charts/CategorySpendingChart';
import { FinancialSummaryCard } from '@/components/dashboard/FinancialSummaryCard';

// Category icon mapping
const categoryIcons: Record<string, any> = {
  'Food': Utensils,
  'Grocery': ShoppingBag,
  'Shopping': ShoppingCart,
  'Transportation': Car,
  'Housing': Home,
  'Entertainment': Smartphone,
  'Utilities': Zap,
  'Education': Briefcase,
  'Health': Gift,
  'Personal': Coffee,
  'Debt': CreditCard,
  'Other': DollarSign
};

export default function DashboardPage() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Get current month date range for transactions
  const today = new Date();
  const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(today), 'yyyy-MM-dd');
  const dateRange = { start: startDate, end: endDate };
  
  // Fetch real data from Supabase
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions(100, dateRange);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const { data: categorySpending, isLoading: isLoadingCategorySpending } = useCategorySpending();
  const { data: currentBudget } = useCurrentBudget();
  
  // Generate chart data from transactions
  const [chartData, setChartData] = useState<{day: number; amount: number}[]>([]);
  
  useEffect(() => {
    if (transactions) {
      // Generate daily spending data for the current month
      const days = eachDayOfInterval({
        start: startOfMonth(today),
        end: endOfMonth(today)
      });
      
      const dailySpending = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTransactions = transactions.filter(t => 
          format(new Date(t.date), 'yyyy-MM-dd') === dayStr && !t.is_income
        );
        
        const totalAmount = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        return {
          day: parseInt(format(day, 'd')),
          amount: totalAmount
        };
      });
      
      setChartData(dailySpending);
    }
  }, [transactions]);
  
  // Group transactions by date
  const transactionsByDate = transactions ? transactions.reduce<Record<string, typeof transactions>>((acc: Record<string, typeof transactions>, transaction) => {
    const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {}) : {};

  // Format currency
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID').format(numAmount);
  };

  // Calculate max value for chart scaling
  const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) || 100000 : 100000;

  return (
    <div className="space-y-6">
      {/* Header with date range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-gray-500">{format(new Date(startDate), 'dd MMM')} - {format(new Date(endDate), 'dd MMM, yyyy')}</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Select Date
          </Button>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column - Expenses list */}
        <div className="md:col-span-2 space-y-6">
          {/* Expense chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    Week
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs bg-blue-50 text-blue-600">
                    Month
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    Year
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SpendingTrendChart 
                data={chartData} 
                isLoading={isLoadingTransactions} 
                formatCurrency={formatCurrency} 
                currentDay={new Date().getDate()}
              />
            </CardContent>
          </Card>
          
          {/* Today's expenses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Today</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">More options</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-1">
              <div className="space-y-4">
                {isLoadingTransactions ? (
                  <div className="py-4 text-center text-gray-500">Loading transactions...</div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No transactions for today</div>
                ) : (
                  transactions
                    .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                    .map((transaction) => {
                      const category = categoriesData?.find(c => c.id === transaction.category_id);
                      const categoryName = category?.name || 'Uncategorized';
                      const Icon = categoryIcons[categoryName] || DollarSign;
                      const colorMap: Record<string, string> = {
                        'Food': 'bg-red-500',
                        'Grocery': 'bg-cyan-500',
                        'Shopping': 'bg-blue-500',
                        'Transportation': 'bg-purple-500',
                        'Housing': 'bg-orange-500',
                        'Entertainment': 'bg-green-500',
                        'Utilities': 'bg-yellow-500',
                        'Education': 'bg-indigo-500',
                        'Health': 'bg-pink-500',
                        'Personal': 'bg-teal-500',
                        'Debt': 'bg-gray-500',
                        'Other': 'bg-blue-500'
                      };
                      const color = colorMap[categoryName] || 'bg-blue-500';
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`${color} p-2 rounded-full mr-3`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{categoryName}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(transaction.date), 'h:mm a')} • {transaction.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-red-500">-{formatCurrency(transaction.amount)}</p>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Yesterday's expenses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>{format(subDays(new Date(), 1), 'EEEE, d MMMM yyyy')}</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">More options</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-1">
              <div className="space-y-4">
                {isLoadingTransactions ? (
                  <div className="py-4 text-center text-gray-500">Loading transactions...</div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No transactions for yesterday</div>
                ) : (
                  transactions
                    .filter(t => format(new Date(t.date), 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd'))
                    .map((transaction) => {
                      const category = categoriesData?.find(c => c.id === transaction.category_id);
                      const categoryName = category?.name || 'Uncategorized';
                      const Icon = categoryIcons[categoryName] || DollarSign;
                      const colorMap: Record<string, string> = {
                        'Food': 'bg-red-500',
                        'Grocery': 'bg-cyan-500',
                        'Shopping': 'bg-blue-500',
                        'Transportation': 'bg-purple-500',
                        'Housing': 'bg-orange-500',
                        'Entertainment': 'bg-green-500',
                        'Utilities': 'bg-yellow-500',
                        'Education': 'bg-indigo-500',
                        'Health': 'bg-pink-500',
                        'Personal': 'bg-teal-500',
                        'Debt': 'bg-gray-500',
                        'Other': 'bg-blue-500'
                      };
                      const color = colorMap[categoryName] || 'bg-blue-500';
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`${color} p-2 rounded-full mr-3`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{categoryName}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(transaction.date), 'h:mm a')} • {transaction.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-red-500">-{formatCurrency(transaction.amount)}</p>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Summary and insights */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <FinancialSummaryCard 
            transactions={transactions || []} 
            isLoading={isLoadingTransactions} 
            formatCurrency={formatCurrency} 
          />
          {/* Spending by category */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Where your money goes</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Donut chart for category spending */}
              <CategorySpendingChart 
                data={categorySpending || []} 
                isLoading={isLoadingCategorySpending} 
                formatCurrency={formatCurrency} 
              />
              
              {/* Top categories with progress bars */}
              <div className="mt-4 space-y-3">
                {isLoadingCategorySpending ? (
                  <div className="py-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : categorySpending && categorySpending.length > 0 ? (
                  categorySpending.slice(0, 3).map((category) => {
                    // Calculate percentage of budget with a fixed budget amount
                    const budgetAmount = 1000000; // Fixed budget amount for demo
                    const progress = Math.min(100, (Number(category.total_spent) / budgetAmount) * 100);
                    
                    return (
                      <div key={category.category_id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{category.category_name}</p>
                          <p className="text-xs font-medium">{formatCurrency(category.total_spent)}</p>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    );
                  })
                ) : (
                  <div className="py-2 text-center text-gray-500 text-xs">No spending data available</div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Savings tips */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none">
            <CardHeader>
              <CardTitle>Save more money</CardTitle>
              <CardDescription>
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-100 w-32 h-32 rounded-lg transform rotate-6"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-orange-100 w-32 h-32 rounded-lg transform -rotate-3"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white w-32 h-20 rounded-lg shadow-md flex items-center justify-center">
                      <DollarSign className="h-10 w-10 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">
                VIEW TIPS
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Floating action button for quick add */}
      <div className="fixed bottom-6 right-6 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
          onClick={() => setIsQuickAddOpen(true)}
        >
          <PlusCircle className="h-6 w-6" />
        </motion.button>
      </div>
      
      {/* Quick add expense modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsQuickAddOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add Expense</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                  onClick={() => setIsQuickAddOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-5">
                {/* Amount input with large display */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Label htmlFor="amount" className="text-sm text-blue-700">Amount</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                    <Input 
                      id="amount" 
                      placeholder="0.00" 
                      className="pl-10 text-xl font-semibold h-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500" 
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Category selection with icons */}
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <div className="grid grid-cols-4 gap-3 mt-2">
                    {isLoadingCategories ? (
                      <div className="col-span-4 py-4 flex justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : !categoriesData || categoriesData.length === 0 ? (
                      <div className="col-span-4 py-4 text-center text-gray-500">No categories available</div>
                    ) : (
                      categoriesData
                        .slice(0, 8)
                        .map((category) => {
                          const Icon = categoryIcons[category.name] || DollarSign;
                          const isSelected = newExpense.category_id === category.id.toString();
                          return (
                            <div
                              key={category.id}
                              className={`${isSelected ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700'} p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-all duration-200 ${isSelected ? 'scale-105' : ''}`}
                              onClick={() => setNewExpense({...newExpense, category_id: category.id.toString()})}
                            >
                              <Icon className="h-6 w-6 mb-1" />
                              <span className="text-xs font-medium">{category.name}</span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
                
                {/* Description input */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="What was this expense for?" 
                    className="mt-1"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                
                {/* Date input */}
                <div>
                  <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    className="mt-1"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                
                {/* Save button */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 h-12 mt-2 rounded-lg font-medium" 
                  onClick={async () => {
                    if (!newExpense.amount || !newExpense.category_id) {
                      alert('Please enter an amount and select a category');
                      return;
                    }
                    
                    try {
                      await createTransaction({
                        amount: parseFloat(newExpense.amount),
                        category_id: newExpense.category_id ? parseInt(newExpense.category_id) : null,
                        description: newExpense.description,
                        date: newExpense.date,
                        is_income: false,
                        receipt_url: null
                      });
                      
                      setIsQuickAddOpen(false);
                      setNewExpense({
                        amount: '',
                        description: '',
                        category_id: '',
                        date: format(new Date(), 'yyyy-MM-dd')
                      });
                      
                      // Show success message and refresh data without full page reload
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                    } catch (error) {
                      console.error('Error creating transaction:', error);
                      alert('Failed to save expense. Please try again.');
                    }
                  }}
                >
                  Save Expense
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
