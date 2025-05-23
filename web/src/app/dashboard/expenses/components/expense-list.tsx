"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";

type DbTransaction = Database["public"]["Tables"]["transactions"]["Row"];
type DbCategory = Database["public"]["Tables"]["categories"]["Row"];

type SortField = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

interface ExpenseListProps {
  expenses: DbTransaction[];
  categories: DbCategory[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  formatCurrency: (amount: number) => string;
}

export function ExpenseList({ expenses, categories, sortField, sortOrder, onSort }: ExpenseListProps) {
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;

      switch (sortField) {
        case "date":
          return multiplier * (new Date(b.date).getTime() - new Date(a.date).getTime());
        case "amount":
          return multiplier * (b.amount - a.amount);
        case "category":
          const categoryA = categories?.find((c) => c.id === a.category_id)?.name || "";
          const categoryB = categories?.find((c) => c.id === b.category_id)?.name || "";
          return multiplier * categoryA.localeCompare(categoryB);
        default:
          return 0;
      }
    });
  }, [expenses, sortField, sortOrder, categories]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex items-center gap-2", {
              "text-blue-600": sortField === "date",
            })}
            onClick={() => onSort("date")}
          >
            Date
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex items-center gap-2", {
              "text-blue-600": sortField === "amount",
            })}
            onClick={() => onSort("amount")}
          >
            Amount
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex items-center gap-2", {
              "text-blue-600": sortField === "category",
            })}
            onClick={() => onSort("category")}
          >
            Category
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedExpenses.map((expense) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {expense.description}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {categories.find((c) => c.id === expense.category_id)?.name}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    ${expense.amount.toFixed(2)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(expense.date), "PPP")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
