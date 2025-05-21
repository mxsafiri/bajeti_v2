'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CategorySpending } from '@/types/database';

interface CategorySpendingChartProps {
  data: CategorySpending[];
  isLoading: boolean;
  formatCurrency: (amount: number | string) => string;
}

// Category colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function CategorySpendingChart({ 
  data, 
  isLoading, 
  formatCurrency 
}: CategorySpendingChartProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[200px] text-gray-500">
        No spending data available
      </div>
    );
  }

  // Prepare data for pie chart
  const chartData = data.map((category, index) => ({
    name: category.category_name,
    value: category.total_spent,
    color: COLORS[index % COLORS.length]
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium text-sm">{payload[0].name}</p>
          <p className="text-blue-600 font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
