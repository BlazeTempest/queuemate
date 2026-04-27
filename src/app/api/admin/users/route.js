import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        globalRating: true,
        role: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const usersWithEffectiveStatus = users.map(user => {
      let effectiveStatus = user.status;
      // If the user isn't explicitly BANNED, check their heartbeat
      if (user.status !== 'BANNED') {
        const isStale = new Date() - new Date(user.lastActiveAt) > 10 * 60 * 1000; // 10 minutes
        if (isStale) {
          effectiveStatus = 'OFFLINE';
        }
      }
      return { ...user, status: effectiveStatus };
    });

    return NextResponse.json(usersWithEffectiveStatus, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
