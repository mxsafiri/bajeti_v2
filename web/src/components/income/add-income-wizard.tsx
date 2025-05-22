'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  BanknoteIcon,
  CalendarIcon,
  PiggyBankIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
  HomeIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/use-supabase-data';

// Form schema
const incomeFormSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  source: z.string().min(1, 'Source is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  date: z.string().min(1, 'Date is required'),
});

type IncomeFormData = z.infer<typeof incomeFormSchema> & {
  amount: string;
  source: string;
  date: string;
  frequency: string;
};

const steps = [
  { id: 'income', title: 'Income Details' },
  { id: 'allocation', title: 'Budget Allocation' },
  { id: 'confirmation', title: 'Confirmation' },
];

export function AddIncomeWizard() {
  const [step, setStep] = useState(0);
  const [allocation, setAllocation] = useState({
    needs: 50,
    wants: 30,
    savings: 20,
  });
  const { toast } = useToast();
  const { addTransaction } = useTransactions();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      amount: '',
      source: '',
      frequency: 'monthly',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: IncomeFormData) => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    try {
      // Add income transaction
      await addTransaction?.({
        amount: parseFloat(data.amount),
        description: `Income from ${data.source}`,
        date: data.date,
        is_income: true,
        category_id: 1, // Income category
        description: `Income from ${data.source} (${data.frequency})`,
      });

      // Create budget allocations
      const amount = parseFloat(data.amount);
      const needsAmount = (amount * allocation.needs) / 100;
      const wantsAmount = (amount * allocation.wants) / 100;
      const savingsAmount = (amount * allocation.savings) / 100;

      // TODO: Create budget entries for each category
      // await createBudgetAllocations({
      //   needs: needsAmount,
      //   wants: wantsAmount,
      //   savings: savingsAmount,
      //   period: data.frequency,
      // });

      toast({
        title: 'Income Added Successfully',
        description: 'Your income and budget allocations have been saved.',
      });

      // Reset form and close dialog
      form.reset();
      setStep(0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add income. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAllocationChange = (type: 'needs' | 'wants' | 'savings', value: number) => {
    setAllocation(prev => {
      const remaining = 100 - value;
      const others = Object.entries(prev)
        .filter(([key]) => key !== type)
        .map(([key]) => key as 'needs' | 'wants' | 'savings');

      const distribution = remaining / others.length;
      return {
        ...prev,
        [type]: value,
        [others[0]]: distribution,
        [others[1]]: distribution
      };
    });
  };

  const calculateAmounts = () => {
    const amount = parseFloat(form.getValues('amount') || '0');
    return {
      needs: (amount * allocation.needs) / 100,
      wants: (amount * allocation.wants) / 100,
      savings: (amount * allocation.savings) / 100,
    };
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Income</CardTitle>
        <CardDescription>
          Let&apos;s help you manage your income and create a budget plan
        </CardDescription>
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`text-sm ${
                  i === step ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {s.title}
              </span>
            ))}
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
        </div>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="income-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Income Amount</Label>
                    <div className="relative">
                      <BanknoteIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="amount"
                        placeholder="Enter amount"
                        className="pl-9"
                        {...form.register('amount')}
                      />
                    </div>
                    {form.formState.errors.amount && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="source">Income Source</Label>
                    <Input
                      id="source"
                      placeholder="e.g., Salary, Freelance"
                      {...form.register('source')}
                    />
                    {form.formState.errors.source && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.source.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      onValueChange={(value: string) =>
                        form.setValue('frequency', value, { shouldValidate: true })
                      }
                      defaultValue={form.getValues('frequency')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Date Received</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="date"
                        type="date"
                        className="pl-9"
                        {...form.register('date')}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="allocation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium">
                    Suggested Budget Allocation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Based on the 50/30/20 rule
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Needs */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <HomeIcon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Needs</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(calculateAmounts().needs)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={allocation.needs} className="flex-1" />
                      <span className="text-sm font-medium w-12">
                        {allocation.needs}%
                      </span>
                    </div>
                  </div>

                  {/* Wants */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShoppingCartIcon className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Wants</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(calculateAmounts().wants)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={allocation.wants} className="flex-1" />
                      <span className="text-sm font-medium w-12">
                        {allocation.wants}%
                      </span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <PiggyBankIcon className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">Savings</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(calculateAmounts().savings)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={allocation.savings} className="flex-1" />
                      <span className="text-sm font-medium w-12">
                        {allocation.savings}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg mt-6">
                  <p className="text-sm text-muted-foreground">
                    This allocation helps ensure you&apos;re saving enough while
                    covering essential expenses. You can adjust these percentages
                    based on your financial goals.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Review Your Income Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Please review the details before confirming
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        {formatCurrency(parseFloat(form.getValues('amount') || '0'))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p className="font-medium">{form.getValues('source')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium">{form.getValues('frequency')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{form.getValues('date')}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Budget Allocation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Needs (50%)</span>
                        <span>{formatCurrency(calculateAmounts().needs)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Wants (30%)</span>
                        <span>{formatCurrency(calculateAmounts().wants)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Savings (20%)</span>
                        <span>{formatCurrency(calculateAmounts().savings)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          <Button type="submit">
            {step === steps.length - 1 ? (
              'Confirm'
            ) : (
              <>
                Next
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
