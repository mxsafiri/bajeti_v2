import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TypeWriter } from "@/components/ui/type-writer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <header className="fixed w-full bg-white/80 backdrop-blur-sm border-b border-blue-100/50 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Bajeti
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                asChild
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
              >
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="relative">
        {/* Hero Section */}
        <div className="pt-32 pb-16 sm:pt-40 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:justify-between lg:gap-12">
              <div className="lg:max-w-xl">
                <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  <TypeWriter 
                    text="Smart budgeting for a "
                    delay={70}
                  />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    <TypeWriter 
                      text="better financial future"
                      delay={70}
                    />
                  </span>
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Take control of your finances with intelligent budgeting tools, expense tracking, 
                  and AI-powered insights to help you achieve your financial goals.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                  <Link
                    href="/auth/sign-up"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Get started
                  </Link>
                  <Link 
                    href="#features" 
                    className="group text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    Learn more{' '}
                    <span className="inline-block transition-transform group-hover:translate-x-1" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>
              </div>

              <div className="relative mt-10 lg:mt-0 lg:flex-shrink-0 w-full max-w-md">
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="col-span-2 flex justify-center">
                    <div className="hero-icon glow p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                      <Image
                        src="/icons/card-icon.svg"
                        alt="Smart card management"
                        width={120}
                        height={120}
                        priority
                      />
                    </div>
                  </div>
                  <div className="hero-icon glow p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                    <Image
                      src="/icons/savings-icon.svg"
                      alt="Track savings"
                      width={120}
                      height={120}
                      priority
                    />
                  </div>
                  <div className="hero-icon glow p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                    <Image
                      src="/icons/insights-icon.svg"
                      alt="AI insights"
                      width={120}
                      height={120}
                      priority
                    />
                  </div>
                </div>
                <div className="absolute inset-0 -z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
                </div>
              </div>
            </div>
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
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Smart Budgeting</h3>
              <p className="mt-2 text-sm text-gray-600">Create customized budgets and track your spending against them in real-time.</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Expense Tracking</h3>
              <p className="mt-2 text-sm text-gray-600">Easily log and categorize your expenses to understand where your money goes.</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
              <p className="mt-2 text-sm text-gray-600">Get personalized recommendations and insights powered by AI to help you save more.</p>
            </Card>
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
