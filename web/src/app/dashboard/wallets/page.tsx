'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Banknote,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Define wallet type interfaces
interface BaseWallet {
  id: number;
  name: string;
  balance: number;
  currency: string;
  color: string;
  icon: React.ReactNode;
  transactions: Transaction[];
}

interface BankWallet extends BaseWallet {
  type: 'bank';
}

interface CashWallet extends BaseWallet {
  type: 'cash';
}

interface LoanWallet extends BaseWallet {
  type: 'loan';
  limit: number;
}

type Wallet = BankWallet | CashWallet | LoanWallet;

// Type guard to check if a wallet is a loan wallet
function isLoanWallet(wallet: Wallet): wallet is LoanWallet {
  return wallet.type === 'loan';
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
}

// Mock data for demonstration
const mockWallets: Wallet[] = [
  { 
    id: 1, 
    name: 'Main Savings', 
    type: 'bank',
    balance: 12500000,
    currency: 'IDR',
    color: 'bg-blue-500',
    icon: <Landmark className="h-5 w-5 text-blue-500" />,
    transactions: [
      { id: 1, type: 'income', amount: 5000000, description: 'Salary', date: '2023-05-01' },
      { id: 2, type: 'expense', amount: 1500000, description: 'Rent', date: '2023-05-03' },
      { id: 3, type: 'expense', amount: 250000, description: 'Groceries', date: '2023-05-05' },
    ]
  },
  { 
    id: 2, 
    name: 'Emergency Fund', 
    type: 'bank',
    balance: 5000000,
    currency: 'IDR',
    color: 'bg-red-500',
    icon: <Landmark className="h-5 w-5 text-red-500" />,
    transactions: [
      { id: 1, type: 'income', amount: 1000000, description: 'Transfer', date: '2023-04-15' },
      { id: 2, type: 'income', amount: 1000000, description: 'Transfer', date: '2023-03-15' },
    ]
  },
  { 
    id: 3, 
    name: 'Mikopo/Loan', 
    type: 'loan',
    balance: 3500000,
    limit: 10000000,
    currency: 'IDR',
    color: 'bg-purple-500',
    icon: <CreditCard className="h-5 w-5 text-purple-500" />,
    transactions: [
      { id: 1, type: 'expense', amount: 1200000, description: 'Electronics', date: '2023-05-02' },
      { id: 2, type: 'expense', amount: 850000, description: 'Dining', date: '2023-05-04' },
      { id: 3, type: 'expense', amount: 450000, description: 'Clothing', date: '2023-05-06' },
    ]
  },
  { 
    id: 4, 
    name: 'Cash Wallet', 
    type: 'cash',
    balance: 750000,
    currency: 'IDR',
    color: 'bg-green-500',
    icon: <Banknote className="h-5 w-5 text-green-500" />,
    transactions: [
      { id: 1, type: 'expense', amount: 50000, description: 'Snacks', date: '2023-05-01' },
      { id: 2, type: 'expense', amount: 150000, description: 'Taxi', date: '2023-05-03' },
      { id: 3, type: 'income', amount: 200000, description: 'Refund', date: '2023-05-04' },
    ]
  },
];

export default function WalletsPage() {
  const [wallets, setWallets] = useState(mockWallets);
  const [activeWallet, setActiveWallet] = useState(mockWallets[0]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate total balance across all wallets
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wallets & Accounts</h1>
          <p className="text-sm text-gray-500">Manage your financial accounts</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Wallet
          </Button>
        </div>
      </div>
      
      {/* Total balance card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <p className="text-xs text-gray-500 mt-1">Across {wallets.length} accounts</p>
        </CardContent>
      </Card>
      
      {/* Wallets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map((wallet) => (
          <motion.div
            key={wallet.id}
            whileHover={{ y: -5 }}
            onClick={() => setActiveWallet(wallet)}
          >
            <Card className={`cursor-pointer ${activeWallet.id === wallet.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${wallet.color.replace('bg-', 'bg-opacity-20')}`}>
                    {wallet.icon}
                  </div>
                  <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(wallet.balance)}</div>
                
                {isLoanWallet(wallet) && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Loan Limit</span>
                      <span>{Math.round((wallet.balance / wallet.limit) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((wallet.balance / wallet.limit) * 100)} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-gray-500">{wallet.transactions.length} recent transactions</p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Selected wallet details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${activeWallet.color.replace('bg-', 'bg-opacity-20')}`}>
                {activeWallet.icon}
              </div>
              <div>
                <CardTitle>{activeWallet.name}</CardTitle>
                <CardDescription>
                  {activeWallet.type === 'bank' ? 'Bank Account' : 
                   activeWallet.type === 'loan' ? 'Mikopo/Loan' : 'Cash Wallet'}
                </CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <ArrowUp className="mr-2 h-4 w-4" />
                Add Income
              </Button>
              <Button variant="outline" size="sm">
                <ArrowDown className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                  <div>Date</div>
                  <div className="col-span-2">Description</div>
                  <div className="text-right">Amount</div>
                </div>
                
                <div className="divide-y">
                  {activeWallet.transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="grid grid-cols-4 p-4 text-sm hover:bg-gray-50"
                    >
                      <div className="text-gray-600">{transaction.date}</div>
                      <div className="col-span-2 font-medium">{transaction.description}</div>
                      <div className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-4">
              <div className="py-12 text-center">
                <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Wallet Analytics</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Visualize your spending patterns and income sources.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <div className="py-12 text-center">
                <h3 className="text-lg font-medium">Wallet Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Customize your wallet details and preferences.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
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
