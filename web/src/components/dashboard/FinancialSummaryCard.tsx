'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types/database";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon, WalletIcon } from "lucide-react";
import { motion } from "framer-motion";

interface FinancialSummaryCardProps {
  transactions: Transaction[];
  isLoading: boolean;
  formatCurrency: (amount: number | string) => string;
}

export function FinancialSummaryCard({ 
  transactions, 
  isLoading,
  formatCurrency 
}: FinancialSummaryCardProps) {
  // Calculate summary data
  const calculateSummary = () => {
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        monthlyChange: 0
      };
    }

    // Get current month transactions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    // Calculate totals
    const totalIncome = currentMonthTransactions
      .filter(t => t.is_income)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;

    // Calculate last month's expenses
    const lastMonthExpenses = lastMonthTransactions
      .filter(t => !t.is_income)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate monthly change percentage
    const monthlyChange = lastMonthExpenses === 0 
      ? 0 
      : ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;

    return {
      totalIncome,
      totalExpenses,
      balance,
      monthlyChange
    };
  };

  const summary = calculateSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-2/3 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Income */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <ArrowDownIcon className="h-3 w-3 mr-1 text-green-500" />
              Income
            </p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>

          {/* Expenses */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <ArrowUpIcon className="h-3 w-3 mr-1 text-red-500" />
              Expenses
            </p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </p>
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <WalletIcon className="h-3 w-3 mr-1 text-blue-500" />
              Balance
            </p>
            <motion.p 
              className={`text-lg font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(summary.balance)}
            </motion.p>
          </div>

          {/* Monthly Change */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <TrendingUpIcon className="h-3 w-3 mr-1 text-purple-500" />
              Monthly Change
            </p>
            <p className={`text-lg font-semibold ${summary.monthlyChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.monthlyChange === 0 
                ? '0%' 
                : `${summary.monthlyChange > 0 ? '+' : ''}${summary.monthlyChange.toFixed(1)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
