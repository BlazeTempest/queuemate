"use client";

import { useState, useEffect } from 'react';
import { Camera, ChevronDown, Save, Loader2, X, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Preset default avatars for the user to choose from
const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Nala",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia"
];

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full appearance-none bg-secondary border border-border text-sm rounded-lg px-3 py-2.5 pr-8 outline-none transition-all',
          'focus:border-primary/60 focus:ring-1 focus:ring-primary/30',
          disabled ? 'opacity-40 cursor-not-allowed text-muted-foreground' : 'text-foreground cursor-pointer'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function ProfileView() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal States
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Password Change State
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(''); // NEW: Holds inline modal errors
  
  // Database Data State
  const [masterGames, setMasterGames] = useState([]);
  
  // Base User State
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Game Profile State
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [game, setGame] = useState('');
  const [rank, setRank] = useState('');
  const [roles, setRoles] = useState([]);
  const [playstyle, setPlaystyle] = useState('casual');

  const selectedGameData = masterGames.find(g => g.id === game);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, gamesRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/games')
        ]);

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setMasterGames(gamesData);
        } else {
          toast.error("Failed to load game databases");
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          setUsername(data.username || '');
          setAvatar(data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username || 'User'}`);
          setSavedProfiles(data.profiles || []);

          if (data.profiles && data.profiles.length > 0) {
            const activeProfile = data.profiles[0];
            setGame(activeProfile.gameId);
            setRank(activeProfile.rankId || '');
            setRoles(activeProfile.roles.map(r => r.roleId) || []);
            setPlaystyle(activeProfile.playstyle || 'casual');
          }
        }
      } catch (error) {
        toast.error("Network error while loading data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGame = (selectedGameId) => {
    setGame(selectedGameId);
    
    const existingProfile = savedProfiles.find(p => p.gameId === selectedGameId);
    
    if (existingProfile) {
      setRank(existingProfile.rankId || '');
      setRoles(existingProfile.roles.map(r => r.roleId) || []);
      setPlaystyle(existingProfile.playstyle || 'casual');
    } else {
      setRank('');
      setRoles([]);
      setPlaystyle('casual');
    }
  };

  const toggleRole = (roleId) => {
    setRoles((prev) => prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]);
  };

  // Helper to reset password modal state cleanly
  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswords({ old: '', new: '', confirm: '' });
    setPasswordError('');
  };

  const handlePasswordSubmit = async () => {
    // 1. Reset previous errors
    setPasswordError('');

    // 2. Client-side validations
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      return setPasswordError("All password fields are required.");
    }
    if (passwords.new !== passwords.confirm) {
      return setPasswordError("New passwords do not match.");
    }
    if (passwords.old === passwords.new) {
      return setPasswordError("New password cannot be the same as your current password.");
    }
    if (passwords.new.length < 6) {
      return setPasswordError("Password must be at least 6 characters.");
    }
    
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new })
      });

      if (res.ok) {
        toast.success("Password changed successfully!");
        closePasswordModal();
      } else {
        const data = await res.json();
        // 3. Catch backend errors (like incorrect current password) and display them in the modal
        setPasswordError(data.error || "Failed to change password");
      }
    } catch (error) {
      setPasswordError("Network error while changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!username) return toast.error("Username cannot be empty");
    if (!game) return toast.error("Please select a main game");

    setIsSaving(true);
    
    const payload = { 
      username, 
      avatar, 
      gameId: game, 
      rankId: rank, 
      roleIds: roles, 
      playstyle 
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Profile saved successfully!');
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar, username } }));
        
        setSavedProfiles(prev => {
          const others = prev.filter(p => p.gameId !== game);
          return [...others, { gameId: game, rankId: rank, roles: roles.map(id => ({ roleId: id })), playstyle }];
        });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save profile');
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      
      {/* --- AVATAR MODAL --- */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Select an Avatar</h3>
              <button onClick={() => setShowAvatarModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {DEFAULT_AVATARS.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setAvatar(url); setShowAvatarModal(false); }}
                  className={cn(
                    "relative aspect-square rounded-full transition-all duration-200 overflow-hidden",
                    avatar === url ? "ring-4 ring-primary ring-offset-2 ring-offset-card" : "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-card"
                  )}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full bg-secondary object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- PASSWORD MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Change Password</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Enter your current and new password</p>
              </div>
              <button 
                onClick={closePasswordModal} 
                className="text-muted-foreground hover:text-foreground mt-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* NEW: Inline Error Box */}
            {passwordError && (
              <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium px-3 py-2.5 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Current Password</label>
                <input
                  type="password"
                  value={passwords.old}
                  onChange={(e) => {
                    setPasswords({...passwords, old: e.target.value});
                    if (passwordError) setPasswordError(''); // Clear error when they start typing
                  }}
                  className="w-full bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">New Password</label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => {
                    setPasswords({...passwords, new: e.target.value});
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => {
                    setPasswords({...passwords, confirm: e.target.value});
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-2">
              <button 
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasswordSubmit}
                disabled={isChangingPassword}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[80px]"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                  </>
                ) : (
                  'Done'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PROFILE PAGE --- */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Customize how others see you</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={avatar} alt="avatar" className="w-16 h-16 rounded-full bg-secondary object-cover" />
            <button 
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card hover:bg-primary/80 transition-colors"
            >
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Click the camera icon to choose an avatar</p>
          </div>
        </div>

        {/* USERNAME & PASSWORD ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2.5 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Password Trigger */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Password</label>
            <div className="flex items-center gap-3 h-[42px]">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-secondary hover:bg-secondary/80 border border-border text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-all whitespace-nowrap h-full"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Game Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Game <span className="text-destructive">*</span>
          </label>
          <Select
            value={game}
            onChange={handleGame}
            options={masterGames.map((g) => ({ value: g.id, label: g.name }))}
            placeholder="Select your main game"
          />
          {!game && (
            <p className="text-xs text-primary flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Select a game to unlock rank and role fields
            </p>
          )}
        </div>

        {/* Rank & Roles */}
        <div className={cn('space-y-4 transition-all duration-300', !game && 'opacity-40 pointer-events-none')}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rank</label>
            <Select
              value={rank}
              onChange={setRank}
              options={selectedGameData ? selectedGameData.ranks.map(r => ({ value: r.id, label: r.name })) : []}
              placeholder="Select your rank"
              disabled={!game}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Roles</label>
            <div className="flex flex-wrap gap-2">
              {(selectedGameData ? selectedGameData.roles : []).map((role) => (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150',
                    roles.includes(role.id)
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                  )}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Playstyle */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Playstyle</label>
          <div className="flex bg-secondary rounded-lg p-1 gap-1 w-fit">
            {['casual', 'competitive'].map((style) => (
              <button
                key={style}
                onClick={() => setPlaystyle(style)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all duration-200',
                  playstyle === style
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed text-primary-foreground font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md shadow-primary/20"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}