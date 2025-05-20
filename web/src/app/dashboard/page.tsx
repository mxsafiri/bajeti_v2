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
  const maxChartValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 100000;

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
            <CardContent className="pt-6">
              <div className="h-[200px] w-full">
                <div className="flex items-end justify-between h-full">
                  {chartData.map((data, index: number) => {
                    const height = (data.amount / maxChartValue) * 100;
                    const isToday = index === 15; // Just for demo, assuming day 16 is today
                    
                    return (
                      <div 
                        key={index} 
                        className="group relative flex flex-col items-center"
                        style={{ height: '100%' }}
                      >
                        <div 
                          className={`w-2 rounded-t-sm ${isToday ? 'bg-blue-500' : 'bg-blue-200'}`}
                          style={{ height: `${height}%` }}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
                          {formatCurrency(data.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
          {/* Spending by category */}
          <Card>
            <CardHeader>
              <CardTitle>Where your money go?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingCategorySpending ? (
                  <div className="py-4 text-center text-gray-500">Loading categories...</div>
                ) : !categorySpending || categorySpending.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">No spending data available</div>
                ) : (
                  categorySpending.slice(0, 5).map((category) => {
                    // Calculate percentage of budget if budget exists
                    const budgetCategory = currentBudget ? currentBudget.amount * 0.2 : 1000000; // Fallback value
                    const progress = Math.min(100, (Number(category.total_spent) / budgetCategory) * 100);
                    
                    return (
                      <div key={category.category_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{category.category_name}</p>
                          <p className="text-sm font-medium">{formatCurrency(category.total_spent)}</p>
                        </div>
                        <Progress value={progress} className="bg-emerald-500" />
                      </div>
                    );
                  })
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
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Expense</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsQuickAddOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <Input 
                      id="amount" 
                      placeholder="0.00" 
                      className="pl-10" 
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {isLoadingCategories ? (
                      <div className="col-span-4 py-4 text-center text-gray-500">Loading categories...</div>
                    ) : !categoriesData || categoriesData.length === 0 ? (
                      <div className="col-span-4 py-4 text-center text-gray-500">No categories available</div>
                    ) : (
                      categoriesData
                        .filter(c => !c.is_income)
                        .slice(0, 8)
                        .map((category) => {
                          const Icon = categoryIcons[category.name] || DollarSign;
                          const isSelected = newExpense.category_id === category.id;
                          return (
                            <div
                              key={category.id}
                              className={`${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'} p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                              onClick={() => setNewExpense({...newExpense, category_id: category.id})}
                            >
                              <Icon className="h-5 w-5 mb-1" />
                              <span className="text-xs">{category.name}</span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="What was this expense for?" 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    if (!newExpense.amount || !newExpense.category_id) {
                      alert('Please enter an amount and select a category');
                      return;
                    }
                    
                    try {
                      await createTransaction({
                        amount: parseFloat(newExpense.amount),
                        category_id: newExpense.category_id,
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
                      
                      // Reload page to refresh data
                      window.location.reload();
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
