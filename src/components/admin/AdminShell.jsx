"use client";

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Gamepad2, Shield, LogOut, Menu, X, 
  ChevronLeft, ChevronRight, ArrowLeft 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Games', icon: Gamepad2, path: '/admin/games' },
];

export default function AdminShell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const NavLinks = ({ isMobile = false }) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Back to app link */}
        <Link
          href="/dashboard"
          onClick={() => isMobile && setMobileOpen(false)}
          title={collapsed && !isMobile ? 'Back to App' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group mb-4',
            collapsed && !isMobile ? 'justify-center' : '',
            'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <ArrowLeft size={18} className="flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
          {(!collapsed || isMobile) && <span>Back to App</span>}
        </Link>

        <p className={cn(
          "text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2",
          collapsed && !isMobile && "text-center px-0"
        )}>
          {collapsed && !isMobile ? '•••' : 'Admin Panel'}
        </p>

        {ADMIN_NAV_ITEMS.map((item) => {
          const active = pathname === item.path || 
            (item.path !== '/admin' && pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              title={collapsed && !isMobile ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                collapsed && !isMobile ? 'justify-center' : '',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
              <item.icon size={18} className={cn(
                'flex-shrink-0',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn('px-3 py-4 border-t border-border space-y-1', collapsed && !isMobile && 'px-2')}>
        {/* Logout */}
        <button
          onClick={() => {
            if (isMobile) setMobileOpen(false);
            handleLogout();
          }}
          disabled={isLoggingOut}
          title={collapsed && !isMobile ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isLoggingOut
              ? 'text-muted-foreground bg-secondary cursor-not-allowed'
              : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            collapsed && !isMobile ? 'justify-center' : ''
          )}
        >
          {isLoggingOut ? (
            <div className="w-4.5 h-4.5 border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin rounded-full flex-shrink-0" />
          ) : (
            <LogOut size={18} className="flex-shrink-0" />
          )}
          {(!collapsed || isMobile) && <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>

        {/* User card */}
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg bg-secondary/50">
            <div className="relative flex-shrink-0">
              <Image
                src={user?.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.username || 'Admin'}`}
                alt="avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full bg-secondary object-cover"
              />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-sidebar-bg flex items-center justify-center">
                <Shield size={8} className="text-primary-foreground" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.username || 'Admin'}
              </p>
              <p className="text-xs font-medium text-primary">Administrator</p>
            </div>
          </div>
        )}

        {collapsed && !isMobile && (
          <div className="flex justify-center py-1 mt-1">
            <div className="relative">
              <Image
                src={user?.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.username || 'Admin'}`}
                alt="avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full bg-secondary object-cover"
                title={user?.username}
              />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-sidebar-bg flex items-center justify-center">
                <Shield size={8} className="text-primary-foreground" />
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:fixed md:flex md:left-0 md:top-0 md:h-full bg-sidebar-bg border-r border-border flex-col z-30 transition-all duration-300',
        collapsed ? 'md:w-16' : 'md:w-64'
      )}>
        <div className={cn(
          'flex items-center border-b border-border h-16 px-4',
          collapsed ? 'justify-center' : 'justify-between px-6'
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-white" />
              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">Admin</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="flex justify-center py-3 text-muted-foreground hover:text-foreground transition-colors border-b border-border">
            <ChevronRight size={18} />
          </button>
        )}
        <NavLinks />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar-bg border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-foreground font-bold tracking-tight">Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile slide-out sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar-bg border-r border-border flex flex-col h-full animate-slide-in">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <span className="text-foreground font-bold text-lg tracking-tight">Admin</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <NavLinks isMobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className={cn(
        'pt-14 md:pt-16 min-h-screen transition-all duration-300',
        collapsed ? 'md:ml-16' : 'md:ml-64'
      )}>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
