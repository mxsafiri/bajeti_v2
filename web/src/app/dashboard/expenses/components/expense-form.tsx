"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type DbTransaction = Database["public"]["Tables"]["transactions"]["Row"];
type DbCategory = Database["public"]["Tables"]["categories"]["Row"];
type NewTransaction = Omit<DbTransaction, "id" | "created_at" | "updated_at"> & { account_id: number | null };

interface ExpenseFormProps {
  categories: DbCategory[];
  onSubmit: (expense: NewTransaction) => Promise<void>;
  onCancel: () => void;
  userId: number;
}

export function ExpenseForm({ categories, onSubmit, onCancel, userId }: ExpenseFormProps) {
  const [expense, setExpense] = useState<NewTransaction>({
    user_id: userId,
    account_id: null,
    category_id: 0, // Assuming 0 or null means no category selected initially
    amount: 0,
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    is_income: false,
    type: "expense",
    receipt_url: null,
  });

  const validateExpense = () => {
    if (expense.amount <= 0) {
      alert('Amount must be greater than zero.');
      return false;
    }
    if (!expense.category_id) {
      alert('Please select a category.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExpense()) return;
    try {
      await onSubmit(expense);
      alert('Expense added successfully!');
    } catch (error) {
      alert('Failed to add expense.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <Label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={expense.amount}
          onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          required
        />
      </div>
      <div className="space-y-4">
        <Label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</Label>
        {/* The Select component here seems to be a custom one, its props might differ from standard HTML select.
            Assuming it's from shadcn/ui, value should be string, onValueChange provides the new string value.
            If category_id: 0 means "Select a category", then it should be handled.
        */}
        <Select
          value={expense.category_id ? expense.category_id.toString() : ""}
          onValueChange={(value) => setExpense({ ...expense, category_id: value ? parseInt(value) : null })}
        >
          <SelectTrigger id="category" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="">Select a category</SelectItem> // Placeholder can be part of SelectValue */}
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <Label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</Label>
        <Input
          id="description"
          type="text"
          value={expense.description || ""} // Handle null case for description
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpense({ ...expense, description: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div className="space-y-4">
        <Label className="block text-sm font-medium text-gray-700">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expense.date}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(expense.date)}
              onSelect={(date) => date && setExpense({ ...expense, date: format(date, "yyyy-MM-dd") })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          Add Expense
        </Button>
      </div>
    </form>
  );
}
