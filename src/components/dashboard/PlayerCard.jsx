"use client";

import Image from 'next/image';
import { Star, Swords, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PlayerCard({ player, onInvite, invited }) {
  // Translate the database status string to a boolean for styling
  const isOnline = player.status === 'ONLINE';

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200',
      'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-default'
    )}>
      {/* Avatar + Status */}
      <div className="flex items-start justify-between">
        <div className="relative">
          <Image
            src={(player.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${player.username}`).trim()}
            alt={player.username}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full bg-secondary object-cover"
          />
          <span className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card',
            isOnline ? 'bg-online' : 'bg-offline'
          )} />
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star size={13} fill="currentColor" />
          <span className="text-xs font-semibold text-foreground">
            {/* Format rating to 1 decimal place (e.g. 4.5) */}
            {Number(player.globalRating).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Name + Game */}
      <div>
        <p className="font-semibold text-foreground text-sm">{player.username}</p>
        {/* Now reads directly from the API response */}
        <p className="text-xs text-muted-foreground mt-0.5">{player.gameName}</p>
      </div>

      {/* Rank */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
          {player.rankName}
        </span>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-md font-medium',
          isOnline ? 'bg-online/10 text-online' : 'bg-secondary text-muted-foreground'
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Roles mapped dynamically from the database strings */}
      <div className="flex flex-wrap gap-1.5">
        {player.roleNames?.map((roleName, idx) => (
          <span key={idx} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-md border border-border">
            {roleName}
          </span>
        ))}
      </div>

      {/* Invite Button - Now reacts to the 'invited' prop! */}
      <button
        onClick={() => !invited && onInvite(player)}
        disabled={invited}
        className={cn(
          "mt-auto w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 rounded-lg transition-all duration-200 border",
          invited 
            ? "bg-secondary text-muted-foreground border-border cursor-not-allowed"
            : "bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-primary/20 hover:border-primary"
        )}
      >
        {invited ? (
          <>
            <Check size={14} />
            Invited
          </>
        ) : (
          <>
            <Swords size={14} />
            Invite
          </>
        )}
      </button>
    </div>
  );
}