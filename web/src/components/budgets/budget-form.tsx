'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

const formSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2024).max(2100),
  needs_percentage: z.number().min(0).max(100),
  wants_percentage: z.number().min(0).max(100),
  savings_percentage: z.number().min(0).max(100),
});

type BudgetFormData = z.infer<typeof formSchema>;

interface BudgetFormProps {
  onSubmit: (data: BudgetFormData) => void;
  isLoading?: boolean;
}

export function BudgetForm({ onSubmit, isLoading = false }: BudgetFormProps) {
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      needs_percentage: 50,
      wants_percentage: 30,
      savings_percentage: 20,
    },
  });

  const onSubmitForm = form.handleSubmit((data: BudgetFormData) => {
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmitForm} className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2024}
                        max={2100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Budget Allocation</h3>
              <FormField
                control={form.control}
                name="needs_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Needs (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wants_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wants (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savings_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Budget...' : 'Create Budget'}
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  );
}
