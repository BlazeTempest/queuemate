"use client"; // Required for hooks and theme toggle

import { Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation'; // Import this!
import { useTheme } from '../../lib/ThemeContext';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/invites': 'Invites',
  '/profile': 'Profile',
  '/match': 'Match Room',
  '/chat': 'Chat',
};

export default function TopBar({ collapsed }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname(); // Get the current path automatically
  
  // Use pathname to look up the title
  const title = PAGE_TITLES[pathname] || 'QueueMate';

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-sidebar border-b border-border flex items-center justify-between px-6 z-20 transition-all duration-300',
      collapsed ? 'left-16' : 'left-64', // This pushes the header start-point
      'hidden md:flex'
    )}>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground rounded-lg w-9 h-9 transition-all duration-200"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="transition-all" />
          ) : (
            <Moon size={18} className="transition-all" />
          )}
        </Button>
      </div>
    </header>
  );
}