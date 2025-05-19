import { redirect } from 'next/navigation'
import { SignUpForm } from '@/components/auth-forms/sign-up-form'
import { getSession } from '@/app/actions'

export default async function SignUpPage() {
  // Check if user is already signed in
  const session = await getSession()
  
  // If signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">Bajeti</h1>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}
