import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Rank name is required' }, { status: 400 });
    }

    const rank = await prisma.rank.create({
      data: {
        name: name.trim(),
        gameId: id,
      },
    });

    return NextResponse.json(rank, { status: 201 });
  } catch (error) {
    console.error('Error creating rank:', error);
    return NextResponse.json({ error: 'Failed to create rank' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(request.url);
    const rankId = url.searchParams.get('rankId');

    if (!rankId) {
      return NextResponse.json({ error: 'rankId is required' }, { status: 400 });
    }

    await prisma.rank.delete({
      where: { id: rankId },
    });

    return NextResponse.json({ message: 'Rank deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting rank:', error);
    return NextResponse.json({ error: 'Failed to delete rank' }, { status: 500 });
  }
}
