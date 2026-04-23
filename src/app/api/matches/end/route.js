import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { matchId } = await request.json();
    if (!matchId) return NextResponse.json({ error: "Match ID required" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      // 1. Mark match as completed
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED' }
      });
      // 2. Scrub all messages associated with this match forever
      await tx.message.deleteMany({
        where: { matchId: matchId }
      });
    });

    // Kick the other player out by firing a Pusher event
    await pusherServer.trigger(`match-${matchId}`, 'match-ended', {
      message: "The match room was closed by the host."
    });

    return NextResponse.json({ message: "Match ended and chat scrubbed" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}