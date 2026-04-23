"use client";

import { useMatch } from '@/lib/MatchContext';
import MatchRoomView from './MatchRoom'; // Import your match room view
import { MessageSquare, Users, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Chat() {
  const { activeMatch } = useMatch();

  // If match is active, show the room right here!
  if (activeMatch) {
    return <MatchRoomView />;
  }

  // Otherwise, show the empty state
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-card border border-border rounded-2xl p-10 max-w-sm w-full text-center shadow-xl flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
          <MessageSquare size={28} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">No Active Match</h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            Chat is only available during an active match.
          </p>
        </div>
        <div className="w-full flex flex-col gap-2">
          <Link href="/invites" className="bg-primary text-white py-2 rounded-xl text-sm font-semibold text-center">
            View Invites
          </Link>
          <Link href="/dashboard" className="bg-secondary text-muted-foreground py-2 rounded-xl text-sm font-semibold text-center">
            Find Players
          </Link>
        </div>
      </div>
    </div>
  );
}