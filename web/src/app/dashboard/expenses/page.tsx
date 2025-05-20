'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  Filter, 
  Calendar, 
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for demonstration
const mockExpenses = [
  { 
    id: 1, 
    date: new Date(), 
    category: 'Groceries', 
    description: 'Weekly shopping', 
    amount: 125000,
    paymentMethod: 'Credit Card'
  },
  { 
    id: 2, 
    date: new Date(Date.now() - 86400000), 
    category: 'Transportation', 
    description: 'Fuel', 
    amount: 85000,
    paymentMethod: 'Debit Card'
  },
  { 
    id: 3, 
    date: new Date(Date.now() - 86400000 * 2), 
    category: 'Entertainment', 
    description: 'Movie tickets', 
    amount: 45000,
    paymentMethod: 'Cash'
  },
  { 
    id: 4, 
    date: new Date(Date.now() - 86400000 * 3), 
    category: 'Utilities', 
    description: 'Electricity bill', 
    amount: 230000,
    paymentMethod: 'Bank Transfer'
  },
  { 
    id: 5, 
    date: new Date(Date.now() - 86400000 * 4), 
    category: 'Dining', 
    description: 'Restaurant dinner', 
    amount: 175000,
    paymentMethod: 'Credit Card'
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(mockExpenses);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
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
          <TabsTrigger value="food">Food</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="shopping">Shopping</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
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
                      <div className="text-right font-medium text-red-600">
                        -{formatCurrency(expense.amount)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {filteredExpenses.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No expenses found matching your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs would have similar content */}
        <TabsContent value="food" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Food and dining expenses will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transport" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transport Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Transportation expenses will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shopping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shopping Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Shopping expenses will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Utilities Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Utility expenses will be shown here.</p>
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
