"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Download, Calendar as CalendarIconLucide, Filter, ArrowUpDown, Loader2 } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useTransactions, useCategories, useCurrentUser, createTransaction } from "@/hooks/use-supabase-data";
import { ExpenseForm } from "./components/expense-form";
import { ExpenseList } from "./components/expense-list";
import { ExpenseFilters } from "./components/expense-filters";
import type { DateRange as DayPickerDateRange } from "react-day-picker";
import type { Database } from "@/lib/database.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type DbTransaction = Database["public"]["Tables"]["transactions"]["Row"];
type DbCategory = Database["public"]["Tables"]["categories"]["Row"];
type NewTransaction = Omit<DbTransaction, "id" | "created_at" | "updated_at"> & { account_id: number | null };
type SortField = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

// Define ExpenseWithCategory if it's used internally and not imported
interface ExpenseWithCategory extends DbTransaction {
  category: string; // Assuming category name is added
  paymentMethod: string; // Assuming this is derived
}

export default function ExpensesPage() {
  const { data: transactionsData, isLoading: isLoadingTransactions, error: transactionsError } = useTransactions();
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useCategories();
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();

  // State management
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortField, setSortField] = useState<SortField>("date");
  const [selectedCategory, setSelectedCategory] = useState<string>("all"); // category id or 'all'
  const [selectedDateRange, setSelectedDateRange] = useState<DayPickerDateRange | undefined>();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newExpenseState, setNewExpenseState] = useState<Omit<NewTransaction, 'user_id' | 'account_id'>>({
    amount: 0,
    category_id: null,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    is_income: false,
    receipt_url: null,
    type: 'expense' as const
  });


  // Use a more robust way to handle potentially null/undefined data from hooks
  const transactions: DbTransaction[] = transactionsData || [];
  const categories: DbCategory[] = categoriesData || [];
  const user = userData;


  // Handle expense creation
  const handleCreateExpense = async (expenseData: NewTransaction) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create an expense",
        variant: "destructive"
      });
      return;
    }

    try {
      // Ensure account_id is present, even if null
      const payload: NewTransaction = {
        ...expenseData,
        user_id: user.id,
        account_id: expenseData.account_id !== undefined ? expenseData.account_id : null,
      };
      await createTransaction(payload);

      setIsAddExpenseOpen(false);
      toast({
        title: "Success",
        description: "Expense added successfully"
      });
      // Reset form if needed (or let ExpenseForm handle its own state reset)
      setNewExpenseState({
        amount: 0,
        category_id: null,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_income: false,
        receipt_url: null,
        type: 'expense' as const
      });
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to add expense",
        variant: "destructive"
      });
    }
  };
  
  const expensesForList = useMemo(() => {
    return transactions
      .filter(t => !t.is_income)
      .map(t => {
        const category = categories.find(c => c.id === t.category_id);
        return {
          ...t,
          category_name: category?.name || 'Uncategorized',
        };
      });
  }, [transactions, categories]);

  const filteredAndSortedExpenses = useMemo(() => {
    let processedExpenses = expensesForList.filter(expense => {
      const expenseDate = parseISO(expense.date);
      const dateMatches = selectedDateRange?.from && selectedDateRange?.to ?
        isWithinInterval(expenseDate, { start: selectedDateRange.from, end: selectedDateRange.to }) : true;

      const categoryMatches = selectedCategory === "all" || (expense.category_id !== null && expense.category_id?.toString() === selectedCategory);
      
      const searchMatches = !searchQuery ||
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category_name?.toLowerCase().includes(searchQuery.toLowerCase());

      return dateMatches && categoryMatches && searchMatches;
    });

    return processedExpenses.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "date":
          return multiplier * (parseISO(a.date).getTime() - parseISO(b.date).getTime());
        case "amount":
          return multiplier * (a.amount - b.amount);
        case "category":
          return multiplier * (a.category_name?.localeCompare(b.category_name || '') || 0);
        default:
          return 0;
      }
    });
  }, [expensesForList, selectedDateRange, selectedCategory, searchQuery, sortField, sortOrder]);


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };
  
  // Format currency - hardcoded to TZS for now
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoadingTransactions || isLoadingCategories) {
    return (
      <div className="container mx-auto py-6 space-y-6 flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (transactionsError || categoriesError) {
    return <div className="container mx-auto py-6">Error loading data. Please try again.</div>;
  }
  
  if (!user) {
     return (
      <div className="container mx-auto py-6 text-center">
        <p>Please log in to view expenses.</p>
        {/* Optionally, add a login button/link here */}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <motion.button
          onClick={() => setIsAddExpenseOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg"
        >
          <PlusCircle className="h-6 w-6" />
        </motion.button>
      </div>

      <ExpenseFilters
        categories={categories || []}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        dateRange={selectedDateRange}
        onDateRangeChange={setSelectedDateRange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <ExpenseList
        expenses={filteredAndSortedExpenses}
        categories={categories || []} // Pass categories for potential display needs in ExpenseList
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        formatCurrency={formatCurrency}
      />

      <AnimatePresence>
        {isAddExpenseOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add New Expense</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsAddExpenseOpen(false)}>
                  <PlusCircle className="h-5 w-5 rotate-45" /> {/* Using PlusCircle as a close icon */}
                </Button>
              </div>
              <ExpenseForm
                categories={categories || []}
                onSubmit={handleCreateExpense}
                onCancel={() => setIsAddExpenseOpen(false)}
                userId={user.id} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
