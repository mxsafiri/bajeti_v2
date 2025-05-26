'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';

interface Category {
  name: string;
  total: number;
  color: string;
}

interface CategoryBreakdownProps {
  categories: Category[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const totalSpending = categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-sm font-medium">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                ${category.total.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">
                {totalSpending > 0
                  ? `${((category.total / totalSpending) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          <Progress
            value={totalSpending > 0 ? (category.total / totalSpending) * 100 : 0}
            className="h-2"
            style={{ backgroundColor: category.color }}
          />
        </div>
      ))}
      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No spending data available
        </p>
      )}
    </div>
  );
}
