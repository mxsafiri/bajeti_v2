import { AddIncomeWizard } from '@/components/income/add-income-wizard';

export default function IncomePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your income to make the most of your money
          </p>
        </div>

        <AddIncomeWizard />
      </div>
    </div>
  );
}
