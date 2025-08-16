'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { useRequireAuth, useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth();
  const { user, userProfile } = useAuth();

  // Debug logging
  console.log('🔐 AppLayout - Auth state:', { 
    loading, 
    user: user?.uid, 
    userProfile: !!userProfile,
    userEmail: user?.email 
  });

  if (loading) {
    console.log('⏳ AppLayout - Showing loading spinner');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <div className="ml-3 text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ AppLayout - No user, redirecting to login');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive">Authentication Required</h2>
          <p className="text-muted-foreground mt-2">Please log in to access this page.</p>
          <a 
            href="/login" 
            className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  console.log('✅ AppLayout - User authenticated, rendering app');
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AppSidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <div className="md:hidden">
              <Logo />
           </div>
          <div className="w-full flex-1" />
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
