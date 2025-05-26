'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';

interface CategoryBreakdownProps {
  data: {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    allocated: number;
    spent: number;
    remaining: number;
  }[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const totalSpending = data.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="space-y-8">
      {data.map((category) => (
        <div key={category.categoryId} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category.categoryColor }}
              />
              <span className="text-sm font-medium">{category.categoryName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                ${category.spent.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((category.spent / totalSpending) * 100)}%
              </span>
            </div>
          </div>
          <Progress
            value={(category.spent / totalSpending) * 100}
            className="h-2"
            style={{ backgroundColor: category.categoryColor }}
          />
        </div>
      ))}
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No spending data available
        </p>
      )}
    </div>
  );
}
