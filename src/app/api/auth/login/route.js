import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher'; // 1. Import Pusher
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();
    
    if (!identifier || !password) {
      return NextResponse.json({ error: "Missing username/email or password" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid User" }, { status: 401 });
    }

    // Block banned users from logging in
    if (user.status === 'BANNED') {
      return NextResponse.json({ 
        error: "Your account has been banned. Please contact the admin for further assistance.",
        banned: true 
      }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid Password" }, { status: 401 });
    }

    // 1. UPDATE DATABASE STATUS TO ONLINE
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE', lastActiveAt: new Date() }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Broadcast that this user is now online
    await pusherServer.trigger('queuemate-global', 'user-online', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar
    });

    const response = NextResponse.json(
      { message: "Login successful", user: { id: user.id, username: user.username, avatar: user.avatar, role: user.role } },
      { status: 200 }
    );

    response.cookies.set('queuemate_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}