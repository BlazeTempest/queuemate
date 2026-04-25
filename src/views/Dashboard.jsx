"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SearchFilters from '../components/dashboard/SearchFilters';
import PlayerCard from '../components/dashboard/PlayerCard';
import Pagination from '../components/dashboard/Pagination';
import { toast } from 'sonner';
import { Users, Loader2 } from 'lucide-react';

const PAGE_SIZE = 8;

export default function Dashboard() {
  // 1. Added state for real DB players and loading status
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState({ game: '', rank: '', role: '', search: '' });
  const [page, setPage] = useState(1);
  const [invitedIds, setInvitedIds] = useState([]);
  const pathname = usePathname();

  // 2. Fetch real players on mount AND when navigating back to this page
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch('/api/players');
        if (res.ok) {
          const data = await res.json();
          setPlayers(data);
          setInvitedIds([]); // Reset invite buttons on every fresh load
        } else {
          toast.error("Failed to fetch players from database.");
        }
      } catch (error) {
        toast.error("Network error while loading players.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayers();
  }, [pathname]);

  // 3. Filtering logic — no game filter needed for initial state
  const isDefaultState = !filters.game && !filters.rank && !filters.role && !filters.search;

  const filtered = players.filter((p) => {
    // Initial state: show only ONLINE players from all games
    if (isDefaultState) return p.status === 'ONLINE';
    
    if (filters.game && p.game !== filters.game) return false;
    if (filters.rank && p.rank !== filters.rank) return false;
    if (filters.role && !p.roles.includes(filters.role)) return false;
    if (filters.search && !p.username.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Sort: online players always first
  const sorted = [...filtered].sort((a, b) => {
    const aOnline = a.status === 'ONLINE' ? 0 : 1;
    const bOnline = b.status === 'ONLINE' ? 0 : 1;
    return aOnline - bOnline;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (f) => {
    setFilters(f);
    setPage(1);
  };

  const handleInvite = async (player) => {
    // 1. Optimistically update the UI so the button feels instant
    setInvitedIds((prev) => [...prev, player.id]);

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiverId: player.id, 
          gameId: player.game
        })
      });

      if (res.ok) {
        toast.success(`Invite sent to ${player.username}!`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send invite");
        // 2. Revert the UI if the server rejected it (e.g. duplicate invite)
        setInvitedIds((prev) => prev.filter(id => id !== player.id));
      }
    } catch (error) {
      toast.error("Network error while sending invite.");
      // Revert the UI on network error
      setInvitedIds((prev) => prev.filter(id => id !== player.id));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Find Teammates</h2>
        <p className="text-muted-foreground text-sm mt-1">Discover players who match your playstyle and rank</p>
      </div>

      <SearchFilters onFilter={handleFilter} />

      {/* 4. Show a loading spinner while fetching the DB */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-foreground font-semibold text-lg">Loading players...</p>
        </div>
      ) : paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold text-lg">
            {isDefaultState ? 'No players online right now' : 'No players found'}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {isDefaultState ? 'Check back later or try filtering by game' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{sorted.length}</span> {isDefaultState ? 'players online' : 'players found'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {paged.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onInvite={handleInvite}
                invited={invitedIds.includes(player.id)}
              />
            ))}
          </div>
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}