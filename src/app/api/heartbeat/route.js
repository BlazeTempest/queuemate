import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST: Client pings this every 5 minutes to say "I'm still here"
export async function POST(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        lastActiveAt: new Date(),
        status: 'ONLINE'
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 });
  }
}
