'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BarChart3, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  
  // Simulate fetching user data
  useEffect(() => {
    // In a real app, this would come from your auth context or API
    setUser({
      name: 'Samantha',
      email: 'samantha@email.com',
      avatar: '/avatars/user-avatar.png'
    });
  }, []);

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
    { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
    { name: 'Summary', href: '/dashboard/summary', icon: BarChart3 },
    { name: 'Accounts', href: '/dashboard/accounts', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white/80 backdrop-blur-sm border-blue-100"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-blue-600 bg-opacity-75"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-white"
            >
              <div className="flex-1 pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center justify-center px-4 mb-6">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Bajeti</h1>
                </div>
                
                {/* User profile for mobile */}
                <div className="px-4 py-4 mb-6 flex items-center border-b border-blue-100">
                  <Avatar className="h-10 w-10 border-2 border-blue-100">
                    <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
                
                <nav className="px-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-700'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          pathname === item.href
                            ? 'text-blue-600'
                            : 'text-gray-400 group-hover:text-blue-600'
                        }`}
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              {/* Sign out button for mobile */}
              <div className="p-4 border-t border-blue-100">
                <form action={signOut}>
                  <Button 
                    type="submit" 
                    variant="outline" 
                    className="w-full flex items-center justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white/90 backdrop-blur-sm border-r border-blue-100 overflow-y-auto">
          {/* Logo */}
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Bajeti</h1>
          </div>
          
          {/* User profile */}
          <div className="px-6 py-4 mb-6 flex flex-col items-center border-b border-blue-100">
            <Avatar className="h-16 w-16 border-2 border-blue-100 mb-3">
              <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-sm font-medium">{user?.name || 'User'}</h2>
            <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-700'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-blue-600'
                    }`}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Sign out button */}
          <div className="p-4 border-t border-blue-100 mt-6">
            <form action={signOut}>
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full flex items-center justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
