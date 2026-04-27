import { prisma } from '@/lib/prisma';
import { Users, Wifi, Gamepad2, Swords, Clock, Shield, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export default async function AdminOverviewPage() {
  // Fetch all metrics in parallel for performance
  const [
    totalUsers,
    onlineUsers,
    activeMatches,
    totalGames,
    recentUsers,
    bannedCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { status: { in: ['ONLINE', 'IN_GAME'] } },
    }),
    prisma.match.count({
      where: { status: { in: ['WAITING', 'ACTIVE'] } },
    }),
    prisma.game.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: { status: 'BANNED' },
    }),
  ]);

  const metrics = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'from-blue-500 to-cyan-400',
      bgGlow: 'bg-blue-500/10',
    },
    {
      label: 'Online / In-Game',
      value: onlineUsers,
      icon: Wifi,
      color: 'from-green-500 to-emerald-400',
      bgGlow: 'bg-green-500/10',
    },
    {
      label: 'Active Matches',
      value: activeMatches,
      icon: Swords,
      color: 'from-purple-500 to-pink-400',
      bgGlow: 'bg-purple-500/10',
    },
    {
      label: 'Total Games',
      value: totalGames,
      icon: Gamepad2,
      color: 'from-orange-500 to-amber-400',
      bgGlow: 'bg-orange-500/10',
    },
    {
      label: 'Banned Users',
      value: bannedCount,
      icon: Shield,
      color: 'from-red-500 to-rose-400',
      bgGlow: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your platform at a glance
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="relative group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 overflow-hidden"
          >
            {/* Background glow effect */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${metric.bgGlow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">
                  {metric.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <metric.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recently Registered</h2>
            <p className="text-xs text-muted-foreground">Latest 5 users who signed up</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.map((u) => (
            <div key={u.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
              <Image
                src={u.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${u.username}`}
                alt={u.username}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full bg-secondary object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{u.username}</p>
                  {u.role === 'ADMIN' && (
                    <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  u.status === 'ONLINE' ? 'bg-green-500/10 text-green-400' :
                  u.status === 'IN_GAME' ? 'bg-purple-500/10 text-purple-400' :
                  u.status === 'BANNED' ? 'bg-red-500/10 text-red-400' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    u.status === 'ONLINE' ? 'bg-green-400' :
                    u.status === 'IN_GAME' ? 'bg-purple-400' :
                    u.status === 'BANNED' ? 'bg-red-400' :
                    'bg-muted-foreground'
                  }`} />
                  {u.status}
                </span>
              </div>
              <div className="text-right flex-shrink-0 hidden md:block">
                <p className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
          {recentUsers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Users size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No users registered yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
