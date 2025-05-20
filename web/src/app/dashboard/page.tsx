'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Mock data for demonstration
const mockExpenses = [
  { id: 1, category: 'Grocery', amount: 328800, date: new Date(), description: 'Belanja di pasar', icon: ShoppingBag, color: 'bg-cyan-500' },
  { id: 2, category: 'Transportation', amount: 15000, date: new Date(), description: 'Naik bus umum', icon: Car, color: 'bg-purple-500' },
  { id: 3, category: 'Housing', amount: 185750, date: new Date(), description: 'Bayar Listrik', icon: Home, color: 'bg-orange-500' },
  { id: 4, category: 'Food', amount: 156000, date: new Date(Date.now() - 86400000), description: 'Makan Steak', icon: Utensils, color: 'bg-red-500' },
  { id: 5, category: 'Entertainment', amount: 35200, date: new Date(Date.now() - 86400000), description: 'Nonton Bioskop', icon: Smartphone, color: 'bg-green-500' },
];

const mockCategories = [
  { name: 'Food and Drinks', amount: 872400, progress: 65, color: 'bg-emerald-500' },
  { name: 'Shopping', amount: 1378200, progress: 85, color: 'bg-emerald-500' },
  { name: 'Housing', amount: 928500, progress: 45, color: 'bg-emerald-500' },
  { name: 'Transportation', amount: 420700, progress: 30, color: 'bg-emerald-500' },
  { name: 'Vehicle', amount: 520000, progress: 25, color: 'bg-emerald-500' },
];

const mockChartData = Array.from({ length: 31 }, (_, i) => ({
  day: i + 1,
  amount: Math.floor(Math.random() * 100000) + 10000,
}));

export default function DashboardPage() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenses, setExpenses] = useState(mockExpenses);
  const [categories, setCategories] = useState(mockCategories);
  const [chartData, setChartData] = useState(mockChartData);
  
  // Group expenses by date
  const expensesByDate = expenses.reduce<Record<string, typeof expenses>>((acc, expense) => {
    const dateKey = format(expense.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(expense);
    return acc;
  }, {});

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  // Calculate max value for chart scaling
  const maxChartValue = Math.max(...chartData.map(d => d.amount));

  return (
    <div className="space-y-6">
      {/* Header with date range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-gray-500">01 - 25 March, 2020</p>
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
                  {chartData.map((data, index) => {
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
                {expenses.filter(e => format(e.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`${expense.color} p-2 rounded-full mr-3`}>
                        <expense.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-xs text-gray-500">{format(expense.date, 'h:mm a')} • {expense.description}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Yesterday's expenses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Monday, 23 March 2020</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">More options</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-1">
              <div className="space-y-4">
                {expenses.filter(e => format(e.date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`${expense.color} p-2 rounded-full mr-3`}>
                        <expense.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-xs text-gray-500">{format(expense.date, 'h:mm a')} • {expense.description}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
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
                {categories.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-sm font-medium">{formatCurrency(category.amount)}</p>
                    </div>
                    <Progress value={category.progress} className={category.color} />
                  </div>
                ))}
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
                    <Input id="amount" placeholder="0.00" className="pl-10" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { icon: ShoppingBag, label: 'Shopping', color: 'bg-blue-100 text-blue-600' },
                      { icon: Utensils, label: 'Food', color: 'bg-red-100 text-red-600' },
                      { icon: Home, label: 'Housing', color: 'bg-green-100 text-green-600' },
                      { icon: Car, label: 'Transport', color: 'bg-purple-100 text-purple-600' },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`${item.color} p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <item.icon className="h-5 w-5 mb-1" />
                        <span className="text-xs">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="What was this expense for?" />
                </div>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                </div>
                
                <Button className="w-full">Save Expense</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
