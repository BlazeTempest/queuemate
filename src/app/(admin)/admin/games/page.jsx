"use client";

import { useState, useEffect } from 'react';
import { 
  Gamepad2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, 
  Loader2, X, Tag, Swords, RefreshCw, AlertTriangle, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Create/Edit Game Modal ────────────────────────────────────
function GameFormModal({ game, onClose, onSave }) {
  const isEditing = !!game;
  const [name, setName] = useState(game?.name || '');
  const [maxPlayers, setMaxPlayers] = useState(game?.maxPlayers || 2);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const url = isEditing ? `/api/admin/games/${game.id}` : '/api/admin/games';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), maxPlayers: parseInt(maxPlayers) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      const saved = await res.json();
      onSave(saved, isEditing);
      toast.success(isEditing ? 'Game updated' : 'Game created');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Game' : 'Create New Game'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Game Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Valorant"
              required
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Max Players per Match</label>
            <input
              type="number"
              min={1}
              max={100}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-all text-sm font-medium border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ─────────────────────────────────
function DeleteConfirmModal({ gameName, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Delete Game</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">{gameName}</span>?
              This will permanently remove all associated ranks, roles, player profiles, matches, and invites.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-all text-sm font-medium border border-border"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ranks & Roles Panel ───────────────────────────────────────
function RanksRolesPanel({ game, onUpdate }) {
  const [newRank, setNewRank] = useState('');
  const [newRole, setNewRole] = useState('');
  const [addingRank, setAddingRank] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleAddRank = async (e) => {
    e.preventDefault();
    if (!newRank.trim()) return;
    setAddingRank(true);
    try {
      const res = await fetch(`/api/admin/games/${game.id}/ranks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRank.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create rank');
      const rank = await res.json();
      onUpdate({
        ...game,
        ranks: [...game.ranks, rank].sort((a, b) => a.name.localeCompare(b.name)),
      });
      setNewRank('');
      toast.success(`Rank "${rank.name}" added`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAddingRank(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    setAddingRole(true);
    try {
      const res = await fetch(`/api/admin/games/${game.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create role');
      const role = await res.json();
      onUpdate({
        ...game,
        roles: [...game.roles, role].sort((a, b) => a.name.localeCompare(b.name)),
      });
      setNewRole('');
      toast.success(`Role "${role.name}" added`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAddingRole(false);
    }
  };

  const handleDeleteRank = async (rankId, rankName) => {
    setDeletingId(rankId);
    try {
      const res = await fetch(`/api/admin/games/${game.id}/ranks?rankId=${rankId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rank');
      onUpdate({
        ...game,
        ranks: game.ranks.filter(r => r.id !== rankId),
      });
      toast.success(`Rank "${rankName}" deleted`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    setDeletingId(roleId);
    try {
      const res = await fetch(`/api/admin/games/${game.id}/roles?roleId=${roleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete role');
      onUpdate({
        ...game,
        roles: game.roles.filter(r => r.id !== roleId),
      });
      toast.success(`Role "${roleName}" deleted`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="border-t border-border bg-secondary/20 px-6 py-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ranks Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag size={14} className="text-amber-400" />
            <h4 className="text-sm font-semibold text-foreground">Ranks</h4>
            <span className="text-xs text-muted-foreground">({game.ranks.length})</span>
          </div>
          
          {/* Add Rank Form */}
          <form onSubmit={handleAddRank} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newRank}
              onChange={(e) => setNewRank(e.target.value)}
              placeholder="e.g. Diamond"
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={addingRank || !newRank.trim()}
              className="px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {addingRank ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Add
            </button>
          </form>
          
          {/* Rank List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {game.ranks.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center">No ranks defined</p>
            )}
            {game.ranks.map(rank => (
              <div key={rank.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border group hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-medium text-foreground">{rank.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteRank(rank.id, rank.name)}
                  disabled={deletingId === rank.id}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all disabled:opacity-50"
                >
                  {deletingId === rank.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Swords size={14} className="text-cyan-400" />
            <h4 className="text-sm font-semibold text-foreground">Roles</h4>
            <span className="text-xs text-muted-foreground">({game.roles.length})</span>
          </div>

          {/* Add Role Form */}
          <form onSubmit={handleAddRole} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="e.g. Duelist"
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={addingRole || !newRole.trim()}
              className="px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {addingRole ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Add
            </button>
          </form>

          {/* Role List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {game.roles.length === 0 && (
              <p className="text-xs text-muted-foreground py-3 text-center">No roles defined</p>
            )}
            {game.roles.map(role => (
              <div key={role.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-card border border-border group hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-medium text-foreground">{role.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteRole(role.id, role.name)}
                  disabled={deletingId === role.id}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all disabled:opacity-50"
                >
                  {deletingId === role.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Games Page ───────────────────────────────────────────
export default function AdminGamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedGameId, setExpandedGameId] = useState(null);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/games');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGames(data);
    } catch (error) {
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGames(); }, []);

  const handleSave = (savedGame, isEditing) => {
    if (isEditing) {
      setGames(prev => prev.map(g => g.id === savedGame.id ? savedGame : g));
    } else {
      setGames(prev => [...prev, savedGame].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/games/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setGames(prev => prev.filter(g => g.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleGameUpdate = (updatedGame) => {
    setGames(prev => prev.map(g => g.id === updatedGame.id ? updatedGame : g));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={32} className="text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Game Management</h1>
          <p className="text-muted-foreground mt-1">{games.length} games configured</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchGames}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all text-sm font-medium border border-border"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => { setEditingGame(null); setShowFormModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium shadow-lg shadow-primary/25"
          >
            <Plus size={16} />
            Create Game
          </button>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-3">
        {games.map((game) => (
          <div key={game.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all">
            {/* Game Row */}
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Gamepad2 size={20} className="text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{game.name}</h3>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={11} />
                    {game.maxPlayers} players
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag size={11} />
                    {game.ranks.length} ranks
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Swords size={11} />
                    {game.roles.length} roles
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle Ranks/Roles Panel */}
                <button
                  onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    expandedGameId === game.id
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                  )}
                >
                  {expandedGameId === game.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Ranks & Roles
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setEditingGame(game); setShowFormModal(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all"
                >
                  <Pencil size={12} />
                  Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(game)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>

            {/* Expanded Ranks/Roles Panel */}
            {expandedGameId === game.id && (
              <RanksRolesPanel game={game} onUpdate={handleGameUpdate} />
            )}
          </div>
        ))}

        {games.length === 0 && (
          <div className="bg-card border border-border rounded-xl px-6 py-16 text-center">
            <Gamepad2 size={36} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No games configured yet</p>
            <button
              onClick={() => { setEditingGame(null); setShowFormModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Create Your First Game
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        <GameFormModal
          game={editingGame}
          onClose={() => { setShowFormModal(false); setEditingGame(null); }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          gameName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
