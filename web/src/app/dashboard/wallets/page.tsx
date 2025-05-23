'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  Wallet as WalletIcon, // Renamed to avoid conflict with type
  CreditCard,
  Landmark,
  Banknote,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Loader2, // For loading state
  AlertTriangle // For error state
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useFinancialAccounts, useTransactionsForAccount } from '@/hooks/use-supabase-data';
import type { FinancialAccount } from '@/types/database';
import type { Transaction as DbTransaction } from '@/types/database'; // Renamed to avoid conflict
import { Skeleton } from '@/components/ui/skeleton';


// Enhanced Wallet type for UI, extending FinancialAccount
interface UiWallet extends FinancialAccount {
  color: string;
  icon: React.ReactNode;
  // Transactions will be fetched separately
  // limit?: number; // Assuming 'loan' type might have a limit, not in DB schema yet
}

// Type guard for loan-like accounts (example, adjust if 'limit' is added to DB)
// function isLoanWallet(wallet: UiWallet): wallet is UiWallet & { limit: number } {
//   return wallet.type.toLowerCase() === 'loan' && typeof (wallet as any).limit === 'number';
// }

// Helper to get display properties for a wallet
const getWalletDisplayProps = (accountType: string): { icon: React.ReactNode; color: string } => {
  const typeLower = accountType.toLowerCase();
  if (typeLower.includes('bank') || typeLower.includes('savings')) {
    return { icon: <Landmark className="h-5 w-5 text-blue-500" />, color: 'bg-blue-500' };
  }
  if (typeLower.includes('cash')) {
    return { icon: <Banknote className="h-5 w-5 text-green-500" />, color: 'bg-green-500' };
  }
  if (typeLower.includes('loan') || typeLower.includes('credit')) {
    return { icon: <CreditCard className="h-5 w-5 text-purple-500" />, color: 'bg-purple-500' };
  }
  return { icon: <WalletIcon className="h-5 w-5 text-gray-500" />, color: 'bg-gray-500' }; // Default
};


export default function WalletsPage() {
  const {
    data: financialAccountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
    refetch: refetchAccounts,
  } = useFinancialAccounts();
  
  const [activeWallet, setActiveWallet] = useState<UiWallet | null>(null);

  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsForAccount(activeWallet?.id ?? null);

  // Transform financialAccountsData to UiWallet[]
  const wallets: UiWallet[] = useMemo(() => {
    if (!financialAccountsData) return [];
    return financialAccountsData.map(acc => ({
      ...acc,
      ...getWalletDisplayProps(acc.type),
    }));
  }, [financialAccountsData]);

  useEffect(() => {
    if (wallets.length > 0 && !activeWallet) {
      setActiveWallet(wallets[0]);
    }
  }, [wallets, activeWallet]);
  
  // Format currency
  const formatCurrency = (amount: number, currencyCode: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currencyCode, // Use dynamic currency code
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate total balance across all wallets
  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  }, [wallets]);

  if (isLoadingAccounts) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 mt-4 sm:mt-0" />
        </div>
        <Skeleton className="h-24 w-full" /> {/* Total balance card skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" /> {/* Selected wallet details skeleton */}
      </div>
    );
  }

  if (accountsError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error loading accounts</h2>
        <p className="text-sm mb-4">{accountsError.message}</p>
        <Button onClick={() => refetchAccounts()}>Try Again</Button>
      </div>
    );
  }
  
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
          <div className="text-2xl font-bold">{formatCurrency(totalBalance, wallets[0]?.currency || 'IDR')}</div>
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
            <Card className={`cursor-pointer ${activeWallet?.id === wallet.id ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${wallet.color.replace('bg-', 'bg-opacity-20 ')}`}>
                    {wallet.icon}
                  </div>
                  <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</div>
                
                {/* {isLoanWallet(wallet) && ( // Loan specific UI, adapt if needed
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Loan Limit</span>
                      <span>{Math.round((wallet.balance / wallet.limit) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((wallet.balance / wallet.limit) * 100)} />
                  </div>
                )} */}
              </CardContent>
              <CardFooter className="pt-0">
                 {/* Transaction count will be dynamic based on fetched transactionsData */}
                <p className="text-xs text-gray-500">
                  {isLoadingTransactions && activeWallet?.id === wallet.id ? <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" /> : ''}
                  {transactionsData && activeWallet?.id === wallet.id ? `${transactionsData.length} recent transactions` : `View transactions`}
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Selected wallet details */}
      {activeWallet && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${activeWallet.color.replace('bg-', 'bg-opacity-20 ')}`}>
                {activeWallet.icon}
              </div>
              <div>
                <CardTitle>{activeWallet.name}</CardTitle>
                <CardDescription>
                  {activeWallet.type.charAt(0).toUpperCase() + activeWallet.type.slice(1)} Account
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
              {isLoadingTransactions && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  <p className="ml-2 text-gray-500">Loading transactions...</p>
                </div>
              )}
              {transactionsError && (
                <div className="py-12 text-center text-red-500">
                  <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
                  <p className="font-medium">Error loading transactions</p>
                  <p className="text-sm mb-3">{transactionsError.message}</p>
                  <Button onClick={() => refetchTransactions()} size="sm">Try Again</Button>
                </div>
              )}
              {!isLoadingTransactions && !transactionsError && transactionsData && (
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 bg-gray-50 p-4 text-sm font-medium text-gray-500">
                    <div>Date</div>
                    <div className="col-span-2">Description</div>
                    <div className="text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y">
                    {transactionsData.length === 0 && (
                      <p className="p-4 text-sm text-gray-500 text-center">No transactions found for this account.</p>
                    )}
                    {transactionsData.map((transaction: DbTransaction) => (
                      <div
                        key={transaction.id}
                        className="grid grid-cols-4 p-4 text-sm hover:bg-gray-50"
                      >
                        <div className="text-gray-600">{new Date(transaction.date).toLocaleDateString()}</div>
                        <div className="col-span-2 font-medium">{transaction.description || 'N/A'}</div>
                        <div className={`text-right font-medium ${transaction.is_income ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.is_income ? '+' : '-'}{formatCurrency(transaction.amount, activeWallet.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-4">
              <div className="py-12 text-center">
                <WalletIcon className="mx-auto h-12 w-12 text-gray-400" />
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
      )}
      {!activeWallet && !isLoadingAccounts && wallets.length > 0 && (
         <Card className="py-12 text-center">
            <CardContent>
              <WalletIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">Select a wallet</p>
              <p className="text-sm text-gray-500">Click on a wallet card above to see its details and transactions.</p>
            </CardContent>
          </Card>
      )}
       {!isLoadingAccounts && wallets.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <WalletIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">No Wallets Found</p>
            <p className="text-sm text-gray-500 mb-4">
              It looks like you haven't added any financial accounts yet.
            </p>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Wallet
            </Button>
          </CardContent>
        </Card>
      )}
      
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
