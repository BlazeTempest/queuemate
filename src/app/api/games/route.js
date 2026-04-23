import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all games, and explicitly include their related Ranks and Roles
    const games = await prisma.game.findMany({
      include: {
        ranks: true,
        roles: true,
      },
      orderBy: {
        name: 'asc' // Sort alphabetically
      }
    });

    return NextResponse.json(games, { status: 200 });

  } catch (error) {
    console.error("Error fetching games data:", error);
    return NextResponse.json({ error: "Failed to fetch games data" }, { status: 500 });
  }
}