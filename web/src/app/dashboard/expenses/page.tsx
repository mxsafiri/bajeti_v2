'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import type { Transaction as DbTransaction, Category } from '@/types/database';
import { 
  PlusCircle, 
  Filter, 
  Calendar, 
  ArrowUpDown,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactions, useCategories, useCurrentUser } from '@/hooks/use-supabase-data';
import type { Database } from '@/lib/database.types';

type ExpenseWithCategory = {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
};

export default function ExpensesPage() {
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(100) as { data: DbTransaction[]; isLoading: boolean; };
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories() as { data: Category[]; isLoading: boolean; };
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Process transactions when data is loaded
  useEffect(() => {
    if (transactions && categories) {
      // Convert transactions to expenses format
      const processedExpenses = transactions.map((transaction) => {
        // Find category name from category_id
        const category = categories.find(cat => cat.id === transaction.category_id);
        
        return {
          id: transaction.id.toString(),
          date: new Date(transaction.date),
          category: category?.name || 'Uncategorized',
          description: transaction.description || '',
          amount: transaction.amount,
          paymentMethod: transaction.is_income ? 'Income' : 'Expense' // We could enhance this with actual payment methods
        } as ExpenseWithCategory;
      });
      
      setExpenses(processedExpenses);
      setIsLoading(false);
    }
  }, [transactions, categories]);
  
  const { data: user } = useCurrentUser();

  // Format currency - hardcoded to TZS for now
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Filter expenses based on search query
  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense History</h1>
          <p className="text-sm text-gray-500">View and manage all your expenses</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>
      
      {/* Expense categories tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="highest">Highest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-6 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                  <div>Date</div>
                  <div>Category</div>
                  <div className="col-span-2">Description</div>
                  <div>Payment Method</div>
                  <div className="text-right">Amount</div>
                </div>
                
                {isLoading ? (
                  // Loading skeleton
                  <div className="divide-y">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="grid grid-cols-6 p-4 text-sm">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-24" />
                        <div className="col-span-2"><Skeleton className="h-5 w-full" /></div>
                        <Skeleton className="h-5 w-20" />
                        <div className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredExpenses.map((expense) => (
                      <motion.div 
                        key={expense.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-6 p-4 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="text-gray-600">{format(expense.date, 'dd MMM yyyy')}</div>
                        <div className="font-medium">{expense.category}</div>
                        <div className="col-span-2">{expense.description}</div>
                        <div className="text-gray-600">{expense.paymentMethod}</div>
                        <div className={`text-right font-medium ${expense.paymentMethod === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                          {expense.paymentMethod === 'Income' ? '+' : '-'}{formatCurrency(expense.amount)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {!isLoading && filteredExpenses.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No expenses found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs would have similar content */}
        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Income Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                    <div>Date</div>
                    <div>Category</div>
                    <div className="col-span-2">Description</div>
                    <div>Type</div>
                    <div className="text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y">
                    {filteredExpenses
                      .filter(expense => expense.paymentMethod === 'Income')
                      .map((expense) => (
                        <motion.div 
                          key={expense.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-6 p-4 text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="text-gray-600">{format(expense.date, 'dd MMM yyyy')}</div>
                          <div className="font-medium">{expense.category}</div>
                          <div className="col-span-2">{expense.description}</div>
                          <div className="text-gray-600">{expense.paymentMethod}</div>
                          <div className="text-right font-medium text-green-600">
                            +{formatCurrency(expense.amount)}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                  
                  {!isLoading && filteredExpenses.filter(expense => expense.paymentMethod === 'Income').length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-gray-500">No income transactions found.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expense" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Expense Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                    <div>Date</div>
                    <div>Category</div>
                    <div className="col-span-2">Description</div>
                    <div>Type</div>
                    <div className="text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y">
                    {filteredExpenses
                      .filter(expense => expense.paymentMethod === 'Expense')
                      .map((expense) => (
                        <motion.div 
                          key={expense.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-6 p-4 text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="text-gray-600">{format(expense.date, 'dd MMM yyyy')}</div>
                          <div className="font-medium">{expense.category}</div>
                          <div className="col-span-2">{expense.description}</div>
                          <div className="text-gray-600">{expense.paymentMethod}</div>
                          <div className="text-right font-medium text-red-600">
                            -{formatCurrency(expense.amount)}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                  
                  {!isLoading && filteredExpenses.filter(expense => expense.paymentMethod === 'Expense').length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-gray-500">No expense transactions found.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                    <div>Date</div>
                    <div>Category</div>
                    <div className="col-span-2">Description</div>
                    <div>Type</div>
                    <div className="text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y">
                    {filteredExpenses
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .slice(0, 5)
                      .map((expense) => (
                        <motion.div 
                          key={expense.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-6 p-4 text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="text-gray-600">{format(expense.date, 'dd MMM yyyy')}</div>
                          <div className="font-medium">{expense.category}</div>
                          <div className="col-span-2">{expense.description}</div>
                          <div className="text-gray-600">{expense.paymentMethod}</div>
                          <div className={`text-right font-medium ${expense.paymentMethod === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            {expense.paymentMethod === 'Income' ? '+' : '-'}{formatCurrency(expense.amount)}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                  
                  {!isLoading && filteredExpenses.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-gray-500">No transactions found.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="highest" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Highest Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                    <div>Date</div>
                    <div>Category</div>
                    <div className="col-span-2">Description</div>
                    <div>Type</div>
                    <div className="text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y">
                    {filteredExpenses
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((expense) => (
                        <motion.div 
                          key={expense.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-6 p-4 text-sm hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="text-gray-600">{format(expense.date, 'dd MMM yyyy')}</div>
                          <div className="font-medium">{expense.category}</div>
                          <div className="col-span-2">{expense.description}</div>
                          <div className="text-gray-600">{expense.paymentMethod}</div>
                          <div className={`text-right font-medium ${expense.paymentMethod === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            {expense.paymentMethod === 'Income' ? '+' : '-'}{formatCurrency(expense.amount)}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                  
                  {!isLoading && filteredExpenses.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-gray-500">No transactions found.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
        >
          <PlusCircle className="h-6 w-6" />
        </motion.button>
      </div>
    </div>
  );
}
