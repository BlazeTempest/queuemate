import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pusherServer } from '@/lib/pusher';

export async function POST(request) {
  try {
    const { email, username, password, gameId, rankId, roleIds } = await request.json();

    if (!email || !username || !password || !gameId) {
      return NextResponse.json({ error: "All fields are required, including a main game." }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the User, their Profile, AND their Roles in one nested transaction
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        status: 'ONLINE',
        profiles: {
          create: [
            { 
              gameId: gameId, 
              rankId: rankId || null,
              playstyle: 'casual',
              // If they selected roles, create the junction table records
              ...(roleIds && roleIds.length > 0 ? {
                roles: {
                  create: roleIds.map(id => ({ roleId: id }))
                }
              } : {})
            }
          ]
        }
      }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Broadcast that a new user joined and is online
    await pusherServer.trigger('queuemate-global', 'user-online', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar
    });

    const response = NextResponse.json(
      { message: "User registered successfully", user: { id: user.id, username: user.username } },
      { status: 201 }
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
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}