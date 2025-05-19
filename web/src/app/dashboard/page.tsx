import { redirect } from 'next/navigation'
import { getSession, signOut } from '@/app/actions'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  // Check if user is signed in
  const session = await getSession()
  
  // If not signed in, redirect to sign-in page
  if (!session) {
    redirect('/auth/sign-in')
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">Sign out</Button>
        </form>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Welcome, {session.user.user_metadata.full_name || session.user.email}</h2>
          <p className="mt-2 text-sm text-gray-600">
            This is your personal dashboard where you can manage your budgets, track expenses, and view financial insights.
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Monthly Budget</h2>
          <p className="mt-2 text-sm text-gray-600">
            You haven't created any budgets yet. Start by creating your first budget to track your expenses.
          </p>
          <Button className="mt-4" size="sm">Create Budget</Button>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
          <p className="mt-2 text-sm text-gray-600">
            No recent transactions found. Add your first expense to start tracking your spending.
          </p>
          <Button className="mt-4" size="sm">Add Expense</Button>
        </div>
      </div>
      
      <div className="mt-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {session.user.email}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">User ID:</span> {session.user.id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Last Sign In:</span> {new Date(session.user.last_sign_in_at || '').toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
