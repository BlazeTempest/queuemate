import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const games = await prisma.game.findMany({
      include: {
        ranks: { orderBy: { name: 'asc' } },
        roles: { orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(games, { status: 200 });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, maxPlayers } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Game name is required' }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        maxPlayers: parseInt(maxPlayers) || 2,
      },
      include: {
        ranks: true,
        roles: true,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A game with this name already exists' }, { status: 409 });
    }
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
