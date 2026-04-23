"use client";

import { useState, useEffect } from 'react';
import { Check, X, Gamepad2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMatch } from '@/lib/MatchContext';
import { toast } from 'sonner';
import Pusher from 'pusher-js';

export default function Invites() {
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startMatch } = useMatch();
  const router = useRouter();

  useEffect(() => {
    let pusher;
    let isMounted = true;
    
    const initializeDataAndSockets = async () => {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) return;
        const userData = await userRes.json();
        
        if (!isMounted) return;

        const inviteRes = await fetch('/api/invites');
        if (inviteRes.ok && isMounted) {
          const data = await inviteRes.json();
          setInvites(data);
        }

        if (!isMounted) return;

        pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe(`user-${userData.user.id}`);

        channel.bind('new-invite', (newInvite) => {
          setInvites((prev) => [newInvite, ...prev]);
          toast('New invite received!', { icon: '📩' });
        });

      } catch (error) {
        console.error("Error loading invites:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeDataAndSockets();

    return () => {
      isMounted = false;
      if (pusher) pusher.disconnect();
    };
  }, []);

  const accept = async (inv) => {
    // Optimistically remove it from UI
    setInvites((prev) => prev.filter((i) => i.id !== inv.id));
    
    try {
      const res = await fetch('/api/invites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: inv.id, action: 'ACCEPT' })
      });

      if (res.ok) {
        // 1. FIXED: Await the JSON outside the setTimeout!
        const data = await res.json(); 

        toast.success(`Matched with ${inv.from}! Opening match room...`);
        
        const playerForContext = {
          id: inv.senderId,
          username: inv.from,
          avatar: inv.avatar,
          rank: inv.rank,
          game: inv.game,
          online: true,
        };
        
        setTimeout(() => {
          // 2. We use the 'data' we already awaited above
          startMatch({ matchId: data.matchId, player: playerForContext });
          router.push('/chat'); 
        }, 800);

      } else {
        toast.error("Failed to accept invite");
        setInvites((prev) => [inv, ...prev]);
      }
    } catch (error) {
      toast.error("Network error");
      setInvites((prev) => [inv, ...prev]);
    }
  };

  const reject = async (id) => {
    const inv = invites.find((i) => i.id === id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
    
    try {
      await fetch('/api/invites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: id, action: 'REJECT' })
      });
      toast.error(`Rejected invite from ${inv.from}`);
    } catch (e) {
      // Silent fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Loading invites...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Invites</h2>
        <p className="text-muted-foreground text-sm mt-1">Incoming team invitations — accept to open a match room</p>
      </div>

      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Gamepad2 size={28} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold text-lg">No pending invites</p>
          <p className="text-muted-foreground text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl mx-auto">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-border/80 transition-all animate-fade-in"
            >
              <div className="relative flex-shrink-0">
                <img src={inv.avatar} alt={inv.from} className="w-11 h-11 rounded-full bg-secondary object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{inv.from}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">{inv.game}</span>
                  <span className="text-xs text-muted-foreground">{inv.rank}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">{inv.time}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => accept(inv)}
                  className="flex items-center gap-1.5 bg-online/10 hover:bg-online text-online hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 border border-online/20 hover:border-online"
                >
                  <Check size={13} />
                  Accept
                </button>
                <button
                  onClick={() => reject(inv.id)}
                  className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 border border-destructive/20 hover:border-destructive"
                >
                  <X size={13} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}