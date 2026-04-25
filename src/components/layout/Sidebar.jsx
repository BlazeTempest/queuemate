"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Mail, User, LogOut, Menu, X, MessageSquare, ChevronLeft, ChevronRight, Swords, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/SidebarContext';
import { useMatch } from '@/lib/MatchContext';
import Pusher from 'pusher-js';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Invites', icon: Mail, path: '/invites' },
  { label: 'Profile', icon: User, path: '/profile' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
];

function ChatSection({ collapsed, onMobileClose }) {
  const { activeMatch } = useMatch();
  const router = useRouter();

  if (collapsed) return null;

  return (
    <div className="px-3 py-3 border-t border-border">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">Active Match</p>
      {activeMatch ? (
        <button
          onClick={() => { router.push('/chat'); onMobileClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
        >
          <div className="relative flex-shrink-0">
            <Image src={activeMatch.player.avatar || "https://api.dicebear.com/7.x/micah/svg?seed=placeholder"} alt="" width={28} height={28} className="w-7 h-7 rounded-full bg-secondary object-cover" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-online rounded-full border-2 border-sidebar" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-semibold text-primary truncate">{activeMatch.player.username}</p>
            <p className="text-[10px] text-muted-foreground">Match Room active</p>
          </div>
          <Swords size={14} className="flex-shrink-0" />
        </button>
      ) : (
        <div className="px-3 py-3 rounded-lg bg-secondary/50 border border-border text-center">
          <Users size={20} className="text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground font-medium">No active match</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Accept an invite to start chatting</p>
          <div className="flex gap-1.5 mt-2.5">
            <Link
              href="/invites"
              onClick={() => onMobileClose?.()}
              className="flex-1 text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1.5 rounded-md transition-all border border-primary/20 text-center"
            >
              Invites
            </Link>
            <Link
              href="/dashboard"
              onClick={() => onMobileClose?.()}
              className="flex-1 text-[10px] font-semibold bg-secondary text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md transition-all border border-border text-center"
            >
              Find Players
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const { startMatch } = useMatch(); 
  
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false); 
  const [inviteCount, setInviteCount] = useState(0);

  // Initialize data and WebSockets
  useEffect(() => {
    let pusher;
    let isMounted = true; // 1. Add a flag to track if the component is alive

    const init = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) return;
        const userData = await userRes.json();
        
        // 2. If React unmounted this component while we were fetching, STOP here!
        if (!isMounted) return; 
        
        setUser(userData.user);

        // Fetch initial invite count
        const invRes = await fetch('/api/invites');
        if (invRes.ok && isMounted) {
          const invData = await invRes.json();
          setInviteCount(invData.length);
        }

        // 3. Final check before opening the persistent WebSocket connection
        if (!isMounted) return;

        pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        pusher.connection.bind('state_change', (states) => {
          setIsOnline(states.current === 'connected');
        });

        pusher.subscribe('queuemate-global');

        const personalChannel = pusher.subscribe(`user-${userData.user.id}`);
        
        personalChannel.bind('new-invite', () => {
          setInviteCount((prev) => prev + 1);
        });

        personalChannel.bind('invite-accepted', (data) => {
          toast.success(`${data.player.username} accepted your invite! Opening match room...`);
          startMatch(data);
          setTimeout(() => {
            router.push('/chat');
          }, 800);
        });

      } catch (error) {
        console.error("Sidebar initialization error:", error);
      }
    };

    init();

    return () => {
      isMounted = false; // 4. Instantly mark as dead when React unmounts
      if (pusher) pusher.disconnect();
    };
  }, []); // Only run once on mount

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      // When the event fires, update the local user state with the new data!
      setUser((prevUser) => ({
        ...prevUser,
        avatar: event.detail.avatar,
        username: event.detail.username
      }));
    };

    // Attach the listener
    window.addEventListener('profile-updated', handleProfileUpdate);

    // Cleanup the listener when the sidebar unmounts
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);
  
  // Re-fetch invites when navigating so the badge updates if you accepted/rejected an invite
  useEffect(() => {
    const refreshInvites = async () => {
      if (!user) return; 
      try {
        const invRes = await fetch('/api/invites');
        if (invRes.ok) {
          const invData = await invRes.json();
          setInviteCount(invData.length);
        }
      } catch (error) {
        console.error("Failed to refresh invites");
      }
    };
    
    refreshInvites();
  }, [pathname, user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh(); 
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavLinks = ({ isMobile = false }) => (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path || (item.path === '/chat' && pathname === '/match');
          const displayBadge = item.label === 'Invites' ? inviteCount : null;
          
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
              <item.icon size={18} className={cn('flex-shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
              
              {(!collapsed || isMobile) && displayBadge > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {displayBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <ChatSection collapsed={collapsed && !isMobile} onMobileClose={isMobile ? () => setMobileOpen(false) : undefined} />

      <div className={cn('px-3 py-4 border-t border-border space-y-1', collapsed && !isMobile && 'px-2')}>
        <button
          onClick={() => {
            if (isMobile) setMobileOpen(false);
            handleLogout();
          }}
          title={collapsed && !isMobile ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150',
            collapsed && !isMobile ? 'justify-center' : ''
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
        </button>
        
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-lg bg-secondary/50">
            <div className="relative flex-shrink-0">
              <Image 
                src={user?.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.username || 'Guest'}`} 
                alt="avatar" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full bg-secondary object-cover" 
              />
              <span className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-sidebar",
                isOnline ? "bg-online" : "bg-gray-400"
              )} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user ? user.username : 'Loading...'}
              </p>
              <p className={cn(
                "text-xs font-medium",
                isOnline ? "text-online" : "text-gray-400"
              )}>
                {isOnline ? "Online" : "Connecting..."}
              </p>
            </div>
          </div>
        )}
        
        {collapsed && !isMobile && (
          <div className="flex justify-center py-1 mt-1">
            <div className="relative">
              <Image 
                src={user?.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.username || 'Guest'}`} 
                alt="avatar" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full bg-secondary object-cover" 
                title={user?.username}
              />
              <span className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-sidebar",
                isOnline ? "bg-online" : "bg-gray-400"
              )} />
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside className={cn(
        'hidden md:fixed md:flex md:left-0 md:top-0 md:h-full bg-sidebar border-r border-border flex-col z-30 transition-all duration-300',
        collapsed ? 'md:w-16' : 'md:w-64'
      )}>
        <div className={cn('flex items-center border-b border-border h-16 px-4', collapsed ? 'justify-center' : 'justify-between px-6')}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="text-foreground font-bold text-lg tracking-tight">QueueMate</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
          )}
          {!collapsed && (
            <button onClick={toggle} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={toggle} className="flex justify-center py-3 text-muted-foreground hover:text-foreground transition-colors border-b border-border">
            <ChevronRight size={18} />
          </button>
        )}
        <NavLinks />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">Q</span>
          </div>
          <span className="text-foreground font-bold tracking-tight">QueueMate</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground p-1">
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-sidebar border-r border-border flex flex-col h-full animate-slide-in">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="text-foreground font-bold text-lg tracking-tight">QueueMate</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <NavLinks isMobile />
          </aside>
        </div>
      )}
    </>
  );
}