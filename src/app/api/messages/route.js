import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';

// GET: Fetch temporary chat history
export async function GET(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');
    if (!matchId) return NextResponse.json({ error: "Match ID required" }, { status: 400 });

    const messages = await prisma.message.findMany({
      where: { matchId },
      include: { sender: { select: { id: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { matchId, text } = await request.json();
    if (!matchId || !text) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const newMessage = await prisma.message.create({
      data: { matchId, senderId: decoded.userId, text },
      include: { sender: { select: { id: true, username: true, avatar: true } } }
    });

    // Broadcast to the specific match room
    await pusherServer.trigger(`match-${matchId}`, 'new-message', newMessage);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}