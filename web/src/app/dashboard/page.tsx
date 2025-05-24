'use client';
import React from 'react';

import { useState } from 'react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  CreditCard,
  X,
  Coffee,
  Gift,
  Zap,
  Wallet,
  Landmark,
  CircleDollarSign
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

import { 
  useCurrentUser,
  useTransactions,
  useCategories,
  useCategorySpending,
  useCurrentBudget,
  useBudgetSummary,
  createTransaction 
} from '@/hooks/use-supabase-data';
import type { Transaction, Category, CategorySpending } from '@/types/database';

import BudgetForm from './budgets/components/budget-form';

// Category icons mapping
const CATEGORY_ICONS: { [key: string]: React.ElementType } = {
  'Food & Dining': Coffee,
  'Shopping': ShoppingBag,
  'Entertainment': Gift,
  'Utilities': Zap,
  'Transportation': CreditCard,
  'Housing': Landmark,
  'Healthcare': CircleDollarSign,
  'Other': DollarSign
};

export default function DashboardPage() {
  const { toast } = useToast();
  
  // Get current user and their data
  const { data: user, isLoading: userLoading } = useCurrentUser();
  
  // Get recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(5);
  
  // Get categories for spending breakdown
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  
  // Get spending by category
  const { data: categorySpending, isLoading: spendingLoading } = useCategorySpending();
  
  // Get current budget
  const { data: currentBudget, isLoading: budgetLoading } = useCurrentBudget();
  const { data: budgetSummary, isLoading: budgetSummaryLoading } = useBudgetSummary(currentBudget?.id);

  // State for quick add form
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category_id: null as number | null,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    is_income: false,
    receipt_url: null as string | null,
    type: 'expense' as const,
    user_id: user?.id ?? 0,
    account_id: null as number | null
  });

  // Check authentication first
  if (!userLoading && !user) {
    redirect('/auth/login');
  }

  // Show loading state only for initial user load
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If we have a user but other data is loading, show a loading indicator in the layout
  const isLoadingData = transactionsLoading || categoriesLoading || spendingLoading || budgetLoading || budgetSummaryLoading;

  // Handle transaction creation
  const handleCreateTransaction = async () => {
    if (!user) return;

    try {
      const { user_id: _, ...restOfNewExpense } = newExpense; // Destructure and omit user_id from newExpense
      await createTransaction({
        ...restOfNewExpense,
        user_id: user.id, // Use user.id from the authenticated user session
      });

      toast({
        title: "Success",
        description: "Transaction added successfully",
      });

      setIsQuickAddOpen(false);
      setNewExpense({
        amount: 0,
        category_id: null,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_income: false,
        receipt_url: null,
        type: 'expense' as const,
        user_id: user.id,
        account_id: null
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {isLoadingData && (
        <div className="absolute top-0 right-0 m-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {/* Quick Add Transaction Button */}
      <Button
        onClick={() => setIsQuickAddOpen(true)}
        className="fixed bottom-4 right-4 rounded-full p-4"
        disabled={isLoadingData}
      >
        <PlusCircle className="h-6 w-6" />
      </Button>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'TZS'
              }).format(budgetSummary?.total ?? 0)}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions?.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                >
                  <div className="flex items-center space-x-4">
                    {CATEGORY_ICONS[transaction.categories?.name ?? 'Other'] && (
                      <div className="p-2 rounded-full bg-primary/10">
                        {React.createElement(
                          CATEGORY_ICONS[transaction.categories?.name ?? 'Other'],
                          { className: "h-4 w-4 text-primary" }
                        )}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.is_income ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.is_income ? '+' : '-'}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'TZS'
                    }).format(Math.abs(Number(transaction.amount)))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2>Manage Budgets</h2>
          <BudgetForm />
        </div>
      </div>

      {/* Quick Add Transaction Modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Transaction</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsQuickAddOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({
                      ...newExpense,
                      amount: Number(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={String(newExpense.category_id)}
                    onValueChange={(value) => setNewExpense({
                      ...newExpense,
                      category_id: Number(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({
                      ...newExpense,
                      description: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({
                      ...newExpense,
                      date: e.target.value
                    })}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateTransaction}
                >
                  Add Transaction
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
