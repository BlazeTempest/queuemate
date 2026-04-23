"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Next.js router
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { MatchProvider } from '@/lib/MatchContext';
import { SidebarProvider } from '@/lib/SidebarContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from 'sonner';

// This replaces your old <AuthenticatedApp /> logic
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Replaced navigateToLogin() with Next.js router
    if (authError?.type === 'auth_required') {
      router.push('/auth');
    }
  }, [authError, router]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <MatchProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
              
              <AuthGuard>{children}</AuthGuard>
              
              <Toaster />
              <SonnerToaster theme="dark" position="bottom-right" />
            </QueryClientProvider>
          </AuthProvider>
        </MatchProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}