"use client";
import { useState, useEffect } from 'react';
import { User, Mail, Lock, Loader2, Check, Gamepad2, ChevronDown, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthInput from './AuthInput';

export default function SignupForm({ onSwitch }) {
  // Added rankId and roleIds to the form state
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', gameId: '', rankId: '', roleIds: [] });
  const [games, setGames] = useState([]); 
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/games');
        if (res.ok) {
          const data = await res.json();
          setGames(data);
        }
      } catch (error) {
        console.error("Failed to fetch games");
      }
    };
    fetchGames();
  }, []);

  // Helper to find the currently selected game data (to map ranks/roles)
  const selectedGameData = games.find(g => g.id === form.gameId);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  // Handle changing games (clears out rank and roles since they belong to the old game)
  const handleGameChange = (e) => {
    setForm((p) => ({ ...p, gameId: e.target.value, rankId: '', roleIds: [] }));
  };

  // Handle toggling roles on/off
  const toggleRole = (roleId) => {
    setForm((prev) => {
      const currentRoles = prev.roleIds;
      if (currentRoles.includes(roleId)) {
        return { ...prev, roleIds: currentRoles.filter(r => r !== roleId) };
      }
      return { ...prev, roleIds: [...currentRoles, roleId] };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    else if (form.username.length < 3) errs.username = 'Username must be at least 3 characters';
    
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    
    if (!form.gameId) errs.gameId = 'Please select a main game';
    if (form.gameId && !form.rankId) errs.rankId = 'Please select your rank';
    if (form.gameId && form.roleIds.length === 0) errs.roleIds = 'Please select at least one role';
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          gameId: form.gameId,
          rankId: form.rankId,
          roleIds: form.roleIds
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ server: data.error || 'Failed to create account' });
        setLoading(false);
        return;
      }

      setLoading(false);
      setDone(true);
      
    } catch (error) {
      setErrors({ server: 'An unexpected error occurred. Please try again.' });
      setLoading(false);
    }
  };

  const canSubmit = form.username.trim() && form.email.trim() && form.password && form.confirm && form.gameId && form.rankId && form.roleIds.length > 0 && !loading;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-online/15 flex items-center justify-center">
          <Check size={28} className="text-online" />
        </div>
        <p className="text-lg font-bold text-white">Account Created!</p>
        <p className="text-sm text-[#8b9cb8]">Welcome to QueueMate, <span className="text-primary font-semibold">{form.username}</span>!</p>
        <button
          onClick={() => {
            router.push('/dashboard');
            router.refresh();
          }}
          className="mt-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Enter QueueMate →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">Create account</h2>
        <p className="text-sm text-[#8b9cb8] mt-0.5">Join thousands of gamers on QueueMate</p>
      </div>

      {errors.server && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-medium text-center">
          {errors.server}
        </div>
      )}

      {/* Account Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AuthInput label="Username" type="text" placeholder="Username" value={form.username} onChange={set('username')} error={errors.username} icon={User} />
        <AuthInput label="Email" type="email" placeholder="Email" value={form.email} onChange={set('email')} error={errors.email} icon={Mail} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AuthInput label="Password" type="password" placeholder="Password" value={form.password} onChange={set('password')} error={errors.password} icon={Lock} />
        <AuthInput label="Confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} icon={Lock} />
      </div>

      <div className="h-px bg-border/50 w-full my-4" />

      {/* Game Selection */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[#8b9cb8] uppercase pl-1 block">Main Game</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Gamepad2 size={18} />
          </div>
          <select
            value={form.gameId}
            onChange={handleGameChange}
            className={`w-full appearance-none bg-secondary/50 border text-sm text-foreground rounded-xl pl-10 pr-10 py-3 outline-none focus:ring-1 transition-all cursor-pointer ${
              errors.gameId 
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
                : 'border-border focus:border-primary/60 focus:ring-primary/30'
            }`}
          >
            <option value="" disabled>Select your main game</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        {errors.gameId && <p className="text-xs text-red-400 pl-1 mt-1">{errors.gameId}</p>}
      </div>

      {/* Dynamic Rank & Role (Only shows when Game is selected) */}
      {selectedGameData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Rank Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#8b9cb8] uppercase pl-1 block">Rank</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Award size={18} />
              </div>
              <select
                value={form.rankId}
                onChange={set('rankId')}
                className={`w-full appearance-none bg-secondary/50 border text-sm text-foreground rounded-xl pl-10 pr-10 py-3 outline-none focus:ring-1 transition-all cursor-pointer ${
                  errors.rankId 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' 
                    : 'border-border focus:border-primary/60 focus:ring-primary/30'
                }`}
              >
                <option value="" disabled>Select rank</option>
                {selectedGameData.ranks.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {errors.rankId && <p className="text-xs text-red-400 pl-1 mt-1">{errors.rankId}</p>}
          </div>

          {/* Roles Select (Multi-Toggle) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#8b9cb8] uppercase pl-1 block">Roles</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedGameData.roles.map((role) => {
                const isActive = form.roleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>
            {errors.roleIds && <p className="text-xs text-red-400 pl-1 mt-1">{errors.roleIds}</p>}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 mt-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="text-center text-sm text-[#8b9cb8] pt-1">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-primary hover:text-primary/80 font-semibold transition-colors">
          Login
        </button>
      </p>
    </form>
  );
}