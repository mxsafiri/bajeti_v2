import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-blue-600">Bajeti</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/sign-in"
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50"
            >
              Sign in
            </Link>
            <Link 
              href="/auth/sign-up"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:justify-between lg:gap-12">
          <div className="lg:max-w-xl">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Smart budgeting for a better financial future
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Bajeti helps you take control of your finances with intelligent budgeting tools, expense tracking, and AI-powered insights to help you achieve your financial goals.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Link
                href="/auth/sign-up"
                className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get started
              </Link>
              <Link href="#features" className="text-base font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="mt-10 lg:mt-0 lg:flex-shrink-0">
            <Image
              src="/budget-illustration.svg"
              alt="Budget illustration"
              width={500}
              height={400}
              priority
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </main>

      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Features</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to manage your finances effectively.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">Smart Budgeting</h3>
              <p className="mt-2 text-sm text-gray-600">Create customized budgets and track your spending against them in real-time.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">Expense Tracking</h3>
              <p className="mt-2 text-sm text-gray-600">Easily log and categorize your expenses to understand where your money goes.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
              <p className="mt-2 text-sm text-gray-600">Get personalized financial insights and recommendations powered by AI.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-600">&copy; {new Date().getFullYear()} Bajeti. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
