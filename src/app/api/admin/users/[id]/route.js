import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await request.json();

    // Prevent admins from modifying themselves
    if (id === auth.user.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    let updateData = {};

    switch (action) {
      case 'ban':
        updateData = { status: 'BANNED' };
        break;
      case 'unban':
        updateData = { status: 'OFFLINE' };
        break;
      case 'promote':
        updateData = { role: 'ADMIN' };
        break;
      case 'demote':
        updateData = { role: 'USER' };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
