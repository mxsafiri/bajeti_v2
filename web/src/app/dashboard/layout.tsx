'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { signOut } from '@/app/actions';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

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
  const router = useRouter();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<{ full_name?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        setUserMetadata(user.user_metadata as { full_name?: string; avatar_url?: string });
      }
    };

    fetchUser();
  }, []);

  const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt },
    { name: 'Budgets', href: '/dashboard/budgets', icon: Wallet },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if ('error' in result && result.error) {
        throw new Error(result.error);
      }

      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
      });

      // Clear local storage
      localStorage.clear();

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        className="fixed top-4 right-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-card border-r transition-transform duration-200 ease-in-out md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and user info */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Bajeti</h1>
          <div className="mt-4 flex items-center gap-3">
            <Avatar>
              <AvatarImage src={userMetadata?.avatar_url} />
              <AvatarFallback>
                {userMetadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userMetadata?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 mt-4"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-200 ease-in-out',
          'md:ml-64 p-8'
        )}
      >
        {children}
      </main>

      <Toaster />
    </div>
  );
}
