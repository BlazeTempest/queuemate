"use client";

import { useSidebar } from '@/lib/SidebarContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background font-inter">
      <Sidebar />
      <div className="hidden md:block">
        <TopBar collapsed={collapsed} />
      </div>
      <main className={cn('pt-14 md:pt-16 min-h-screen transition-all duration-300', collapsed ? 'md:ml-16' : 'md:ml-64')}>
        <div className="p-4 md:p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}