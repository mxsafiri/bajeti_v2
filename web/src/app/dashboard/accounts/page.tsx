'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, 
  Landmark, 
  CreditCard, 
  Banknote,
  Wallet,
  Link as LinkIcon,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types for account data
interface BaseAccount {
  id: number;
  name: string;
  institution: string;
  balance: number;
  currency: string;
  color: string;
  icon: React.ReactNode;
  lastUpdated: string;
  isConnected: boolean;
}

interface BankAccount extends BaseAccount {
  type: 'bank';
  accountNumber: string;
}

interface MobileMoneyAccount extends BaseAccount {
  type: 'mobile';
  phoneNumber: string;
}

interface LoanAccount extends BaseAccount {
  type: 'loan';
  limit: number;
  dueDate: string;
  interestRate: number;
}

type Account = BankAccount | MobileMoneyAccount | LoanAccount;

// Type guard functions
function isBankAccount(account: Account): account is BankAccount {
  return account.type === 'bank';
}

function isMobileMoneyAccount(account: Account): account is MobileMoneyAccount {
  return account.type === 'mobile';
}

function isLoanAccount(account: Account): account is LoanAccount {
  return account.type === 'loan';
}

export default function AccountsPage() {
  // Mock data for accounts
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      name: 'CRDB Savings',
      type: 'bank',
      institution: 'CRDB Bank',
      balance: 2500000,
      currency: 'TZS',
      accountNumber: '****3456',
      color: 'bg-blue-500',
      icon: <Landmark className="h-5 w-5 text-blue-500" />,
      lastUpdated: '2023-05-15',
      isConnected: true
    },
    {
      id: 2,
      name: 'NMB Current',
      type: 'bank',
      institution: 'NMB Bank',
      balance: 1800000,
      currency: 'TZS',
      accountNumber: '****7890',
      color: 'bg-green-500',
      icon: <Landmark className="h-5 w-5 text-green-500" />,
      lastUpdated: '2023-05-14',
      isConnected: true
    },
    {
      id: 3,
      name: 'M-Pesa',
      type: 'mobile',
      institution: 'Vodacom',
      balance: 350000,
      currency: 'TZS',
      phoneNumber: '+255 7** *** 123',
      color: 'bg-red-500',
      icon: <Wallet className="h-5 w-5 text-red-500" />,
      lastUpdated: '2023-05-16',
      isConnected: true
    },
    {
      id: 4,
      name: 'Tigo Pesa',
      type: 'mobile',
      institution: 'Tigo',
      balance: 120000,
      currency: 'TZS',
      phoneNumber: '+255 6** *** 456',
      color: 'bg-blue-400',
      icon: <Wallet className="h-5 w-5 text-blue-400" />,
      lastUpdated: '2023-05-16',
      isConnected: true
    },
    {
      id: 5,
      name: 'SACCO Loan',
      type: 'loan',
      institution: 'VICOBA',
      balance: 5000000,
      limit: 8000000,
      currency: 'TZS',
      dueDate: '2023-12-15',
      interestRate: 12.5,
      color: 'bg-purple-500',
      icon: <CreditCard className="h-5 w-5 text-purple-500" />,
      lastUpdated: '2023-05-10',
      isConnected: true
    }
  ]);
  
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(accounts[0]);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => {
    // For loan accounts, don't add to total balance
    if (isLoanAccount(account)) return sum;
    return sum + account.balance;
  }, 0);
  
  // Filter accounts by type
  const bankAccounts = accounts.filter(isBankAccount);
  const mobileAccounts = accounts.filter(isMobileMoneyAccount);
  const loanAccounts = accounts.filter(isLoanAccount);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-gray-500">Manage your financial accounts and connections</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>
      
      {/* Total balance card */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalBalance)}</div>
          <p className="text-xs text-blue-700 mt-1">Across {bankAccounts.length + mobileAccounts.length} accounts</p>
        </CardContent>
      </Card>
      
      {/* Accounts tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({accounts.length})</TabsTrigger>
          <TabsTrigger value="bank">Bank ({bankAccounts.length})</TabsTrigger>
          <TabsTrigger value="mobile">Mobile ({mobileAccounts.length})</TabsTrigger>
          <TabsTrigger value="loan">Loans ({loanAccounts.length})</TabsTrigger>
        </TabsList>
        
        {/* All accounts tab */}
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedAccount(account)}
              >
                <Card className={`cursor-pointer ${selectedAccount?.id === account.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${account.color.replace('bg-', 'bg-opacity-20')}`}>
                        {account.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                        <CardDescription className="text-xs">{account.institution}</CardDescription>
                      </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(account.balance)}</div>
                    
                    {isLoanAccount(account) && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Loan Limit</span>
                          <span>{Math.round((account.balance / account.limit) * 100)}%</span>
                        </div>
                        <Progress value={Math.round((account.balance / account.limit) * 100)} />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-xs text-gray-500">Last updated: {account.lastUpdated}</p>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
            
            {/* Add account card */}
            <motion.div
              whileHover={{ y: -5 }}
            >
              <Card className="cursor-pointer h-full border-dashed border-2 border-gray-200 flex flex-col items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <PlusCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Add New Account</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Connect your bank, mobile money, or loan account
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
        
        {/* Bank accounts tab */}
        <TabsContent value="bank" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {bankAccounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedAccount(account)}
              >
                <Card className={`cursor-pointer ${selectedAccount?.id === account.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${account.color.replace('bg-', 'bg-opacity-20')}`}>
                        {account.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                        <CardDescription className="text-xs">{account.institution}</CardDescription>
                      </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(account.balance)}</div>
                    <p className="text-xs text-gray-500 mt-1">Account: {account.accountNumber}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-xs text-gray-500">Last updated: {account.lastUpdated}</p>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
            
            {/* Add bank account card */}
            <motion.div
              whileHover={{ y: -5 }}
            >
              <Card className="cursor-pointer h-full border-dashed border-2 border-gray-200 flex flex-col items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Landmark className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Add Bank Account</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Connect your bank account securely
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
        
        {/* Mobile money tab */}
        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {mobileAccounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedAccount(account)}
              >
                <Card className={`cursor-pointer ${selectedAccount?.id === account.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${account.color.replace('bg-', 'bg-opacity-20')}`}>
                        {account.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                        <CardDescription className="text-xs">{account.institution}</CardDescription>
                      </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(account.balance)}</div>
                    <p className="text-xs text-gray-500 mt-1">Phone: {account.phoneNumber}</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-xs text-gray-500">Last updated: {account.lastUpdated}</p>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
            
            {/* Add mobile money account card */}
            <motion.div
              whileHover={{ y: -5 }}
            >
              <Card className="cursor-pointer h-full border-dashed border-2 border-gray-200 flex flex-col items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Add Mobile Money</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Connect your mobile money account
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
        
        {/* Loans tab */}
        <TabsContent value="loan" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {loanAccounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedAccount(account)}
              >
                <Card className={`cursor-pointer ${selectedAccount?.id === account.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${account.color.replace('bg-', 'bg-opacity-20')}`}>
                        {account.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                        <CardDescription className="text-xs">{account.institution}</CardDescription>
                      </div>
                    </div>
                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(account.balance)}</div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Loan Limit</span>
                        <span>{Math.round((account.balance / account.limit) * 100)}%</span>
                      </div>
                      <Progress value={Math.round((account.balance / account.limit) * 100)} />
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">Due date: {account.dueDate}</p>
                      <p className="text-xs text-gray-500">Interest rate: {account.interestRate}%</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <p className="text-xs text-gray-500">Last updated: {account.lastUpdated}</p>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
            
            {/* Add loan account card */}
            <motion.div
              whileHover={{ y: -5 }}
            >
              <Card className="cursor-pointer h-full border-dashed border-2 border-gray-200 flex flex-col items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Add Loan Account</h3>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Track your SACCO or VICOBA loans
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Selected account details */}
      {selectedAccount && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-full ${selectedAccount.color.replace('bg-', 'bg-opacity-20')}`}>
                  {selectedAccount.icon}
                </div>
                <div>
                  <CardTitle>{selectedAccount.name}</CardTitle>
                  <CardDescription>
                    {selectedAccount.institution} • 
                    {isBankAccount(selectedAccount) && ` Bank Account`}
                    {isMobileMoneyAccount(selectedAccount) && ` Mobile Money`}
                    {isLoanAccount(selectedAccount) && ` Loan Account`}
                  </CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync
                </Button>
                <Button variant="outline" size="sm">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(selectedAccount.balance)}</div>
                  <p className="text-xs text-gray-500 mt-1">Last updated: {selectedAccount.lastUpdated}</p>
                </CardContent>
              </Card>
              
              {isLoanAccount(selectedAccount) && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Loan Limit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(selectedAccount.limit)}</div>
                      <p className="text-xs text-gray-500 mt-1">Total approved amount</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedAccount.dueDate}</div>
                      <p className="text-xs text-gray-500 mt-1">Interest rate: {selectedAccount.interestRate}%</p>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {isBankAccount(selectedAccount) && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Account Number</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-medium">{selectedAccount.accountNumber}</div>
                      <p className="text-xs text-gray-500 mt-1">For reference only</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Institution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-medium">{selectedAccount.institution}</div>
                      <p className="text-xs text-gray-500 mt-1">Banking partner</p>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {isMobileMoneyAccount(selectedAccount) && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Phone Number</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-medium">{selectedAccount.phoneNumber}</div>
                      <p className="text-xs text-gray-500 mt-1">Linked mobile number</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Provider</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-medium">{selectedAccount.institution}</div>
                      <p className="text-xs text-gray-500 mt-1">Mobile money provider</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
              <div className="rounded-md border">
                <div className="py-12 text-center">
                  <p className="text-gray-500">No recent transactions available.</p>
                  <Button variant="outline" className="mt-4">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View in Online Banking
                  </Button>
                </div>
              </div>
            </div>
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
