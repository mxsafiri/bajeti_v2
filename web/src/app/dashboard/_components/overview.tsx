'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface OverviewProps {
  data: {
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    allocated: number;
    spent: number;
    remaining: number;
  }[];
}

export function Overview({ data }: OverviewProps) {
  const chartData = data.map(item => ({
    name: item.categoryName,
    total: item.spent,
    color: item.categoryColor
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar
          dataKey="total"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
