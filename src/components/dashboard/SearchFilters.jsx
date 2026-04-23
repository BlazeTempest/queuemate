"use client";

import { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function Select({ value, onChange, options, placeholder, disabled, isLoading }) {
  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className={cn(
          'w-full appearance-none bg-secondary border border-border text-sm rounded-lg px-3 py-2.5 pr-8 outline-none transition-all',
          'focus:border-primary/60 focus:ring-1 focus:ring-primary/30',
          (disabled || isLoading) ? 'opacity-40 cursor-not-allowed text-muted-foreground' : 'text-foreground cursor-pointer hover:border-border/80'
        )}
      >
        <option value="">{isLoading ? "Loading..." : placeholder}</option>
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>
            {o.label || o}
          </option>
        ))}
      </select>
      {isLoading ? (
        <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
      ) : (
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      )}
    </div>
  );
}

export default function SearchFilters({ onFilter }) {
  // Database Data State
  const [masterGames, setMasterGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  // Filter Values State
  const [game, setGame] = useState('');
  const [rank, setRank] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');

  // Fetch all games, ranks, and roles from the database
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/games');
        if (res.ok) {
          const data = await res.json();
          setMasterGames(data);
        } else {
          toast.error("Failed to load game filters");
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setIsLoadingGames(false);
      }
    };
    fetchGames();
  }, []);

  // Find the currently selected game object to extract its specific ranks and roles
  const selectedGameData = masterGames.find(g => g.id === game);

  const handleGame = (val) => {
    setGame(val);
    setRank('');
    setRole('');
    onFilter({ game: val, rank: '', role: '', search });
  };

  const handleFilter = (updates) => {
    const next = { game, rank, role, search, ...updates };
    onFilter(next);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={game}
          onChange={handleGame}
          options={masterGames.map((g) => ({ value: g.id, label: g.name }))}
          placeholder="Select Game"
          isLoading={isLoadingGames}
        />
        <Select
          value={rank}
          onChange={(v) => { setRank(v); handleFilter({ rank: v }); }}
          options={selectedGameData ? selectedGameData.ranks.map(r => ({ value: r.id, label: r.name })) : []}
          placeholder="Select Rank"
          disabled={!game}
        />
        <Select
          value={role}
          onChange={(v) => { setRole(v); handleFilter({ role: v }); }}
          options={selectedGameData ? selectedGameData.roles.map(r => ({ value: r.id, label: r.name })) : []}
          placeholder="Select Role"
          disabled={!game}
        />
        <div className="relative">
          <Search size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', game ? 'text-muted-foreground' : 'text-muted-foreground/40')} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilter({ search: e.target.value }); }}
            disabled={!game}
            placeholder="Search username..."
            className={cn(
              'w-full bg-secondary border border-border text-sm rounded-lg pl-8 pr-3 py-2.5 outline-none transition-all',
              'focus:border-primary/60 focus:ring-1 focus:ring-primary/30',
              game ? 'text-foreground placeholder:text-muted-foreground' : 'opacity-40 cursor-not-allowed text-muted-foreground'
            )}
          />
        </div>
      </div>
      {!game && !isLoadingGames && (
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Select a game to unlock filters
        </p>
      )}
    </div>
  );
}