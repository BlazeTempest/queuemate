"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Users, Search, ShieldCheck, ShieldOff, Ban, CheckCircle, 
  Star, Loader2, AlertTriangle, RefreshCw, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ConfirmActionModal({ pendingAction, onConfirm, onCancel, loading }) {
  if (!pendingAction) return null;

  const { action, username } = pendingAction;
  
  const actionDetails = {
    ban: {
      title: 'Ban User',
      description: `Are you sure you want to ban ${username}? They will no longer be able to log in to the application.`,
      buttonText: 'Yes, Ban User',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
      iconClass: 'text-red-400 bg-red-500/10'
    },
    unban: {
      title: 'Unban User',
      description: `Are you sure you want to unban ${username}? They will regain access to the application immediately.`,
      buttonText: 'Yes, Unban User',
      buttonClass: 'bg-green-500 hover:bg-green-600 text-white',
      iconClass: 'text-green-400 bg-green-500/10'
    },
    promote: {
      title: 'Promote to Admin',
      description: `Are you sure you want to promote ${username} to an Admin? They will have full access to the admin dashboard and user management.`,
      buttonText: 'Yes, Promote',
      buttonClass: 'bg-primary hover:bg-primary/90 text-white',
      iconClass: 'text-primary bg-primary/10'
    },
    demote: {
      title: 'Demote to User',
      description: `Are you sure you want to demote ${username} to a standard User? They will lose access to the admin dashboard.`,
      buttonText: 'Yes, Demote',
      buttonClass: 'bg-orange-500 hover:bg-orange-600 text-white',
      iconClass: 'text-orange-400 bg-orange-500/10'
    }
  };

  const config = actionDetails[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 text-center space-y-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${config.iconClass}`}>
            <AlertTriangle size={28} />
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-all text-sm font-medium border border-border"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(pendingAction)}
              disabled={loading}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-xl transition-all text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2",
                config.buttonClass
              )}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {config.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleConfirmAction = async (actionData) => {
    const { userId, action, username } = actionData;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }

      const updatedUser = await res.json();
      
      // Update local state instantly
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));

      const actionLabels = { ban: 'banned', unban: 'unbanned', promote: 'promoted to Admin', demote: 'demoted to User' };
      toast.success(`${updatedUser.username} has been ${actionLabels[action]}`);
      setPendingAction(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status) => {
    const styles = {
      'ONLINE': 'bg-green-500/10 text-green-400 border-green-500/20',
      'IN_GAME': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'OFFLINE': 'bg-secondary text-muted-foreground border-border',
      'BANNED': 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    const dotColors = {
      'ONLINE': 'bg-green-400',
      'IN_GAME': 'bg-purple-400',
      'OFFLINE': 'bg-muted-foreground',
      'BANNED': 'bg-red-400',
    };
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', styles[status] || styles['OFFLINE'])}>
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[status] || dotColors['OFFLINE'])} />
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/15 text-primary px-2 py-1 rounded-full border border-primary/20">
          <ShieldCheck size={12} />
          ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-muted-foreground px-2 py-1 rounded-full border border-border">
        USER
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={32} className="text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">{users.length} total users registered</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-all text-sm font-medium border border-border"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Rating</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedUsers.map((u) => {
                const isLowRating = u.globalRating < 2.5 && u.globalRating > 0;
                const isBanned = u.status === 'BANNED';
                
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      'hover:bg-secondary/20 transition-colors',
                      isLowRating && 'bg-red-500/5 hover:bg-red-500/10',
                      isBanned && 'opacity-60'
                    )}
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={u.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${u.username}`}
                          alt={u.username}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full bg-secondary object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{u.username}</p>
                          <p className="text-xs text-muted-foreground truncate md:hidden">{u.email}</p>
                        </div>
                        {isLowRating && (
                          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" title="Low rating" />
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{u.email}</p>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <div className="inline-flex items-center gap-1">
                        <Star size={14} className={cn(
                          isLowRating ? 'text-red-400' : 'text-amber-400'
                        )} fill="currentColor" />
                        <span className={cn(
                          'text-sm font-semibold tabular-nums',
                          isLowRating ? 'text-red-400' : 'text-foreground'
                        )}>
                          {u.globalRating.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 text-center">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      {getStatusBadge(u.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ban/Unban */}
                        {isBanned ? (
                          <button
                            onClick={() => setPendingAction({ userId: u.id, action: 'unban', username: u.username })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={12} />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => setPendingAction({ userId: u.id, action: 'ban', username: u.username })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Ban size={12} />
                            Ban
                          </button>
                        )}

                        {/* Promote/Demote */}
                        {u.role === 'USER' ? (
                          <button
                            onClick={() => setPendingAction({ userId: u.id, action: 'promote', username: u.username })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ShieldCheck size={12} />
                            Promote
                          </button>
                        ) : (
                          <button
                            onClick={() => setPendingAction({ userId: u.id, action: 'demote', username: u.username })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ShieldOff size={12} />
                            Demote
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-16 text-center">
            <Users size={36} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No users match your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination UI */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + pageSize, filteredUsers.length)}</span> of <span className="font-medium text-foreground">{filteredUsers.length}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmActionModal 
        pendingAction={pendingAction} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setPendingAction(null)} 
        loading={actionLoading} 
      />
    </div>
  );
}
