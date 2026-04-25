import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { pusherServer } from '@/lib/pusher';

export async function POST(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    
    // If they have a token, decode it and update the DB
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Optimize: Run DB update and Pusher trigger in parallel
        await Promise.all([
          prisma.user.update({
            where: { id: decoded.userId },
            data: { status: 'OFFLINE' }
          }),
          pusherServer.trigger('queuemate-global', 'user-offline', {
            userId: decoded.userId,
            username: decoded.username
          })
        ]);
      } catch (e) {
        // Token was invalid or expired, proceed to delete cookie anyway
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
    
    // Destroy the secure cookie
    response.cookies.delete('queuemate_session');
    
    return response;

  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}