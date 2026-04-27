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
    const { name, maxPlayers } = await request.json();

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (maxPlayers !== undefined) updateData.maxPlayers = parseInt(maxPlayers);

    const game = await prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        ranks: { orderBy: { name: 'asc' } },
        roles: { orderBy: { name: 'asc' } },
      },
    });

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A game with this name already exists' }, { status: 409 });
    }
    console.error('Error updating game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.game.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Game deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
