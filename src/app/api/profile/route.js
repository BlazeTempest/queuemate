import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profiles: {
          include: { roles: true }
        }
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      username: user.username,
      avatar: user.avatar,
      profiles: user.profiles
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ADDED avatar to the destructuring here!
    const { username, avatar, gameId, rankId, roleIds, playstyle } = await request.json();

    // --- VALIDATION ---
    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }
    if (username.trim().length > 20) {
      return NextResponse.json({ error: "Username cannot exceed 20 characters." }, { status: 400 });
    }
    if (!gameId) {
      return NextResponse.json({ error: "Please select a main game." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      
      // 1. ADDED avatar to the base User update!
      await tx.user.update({
        where: { id: decoded.userId },
        data: { username: username.trim(), avatar } 
      });

      if (gameId) {
        const profile = await tx.userProfile.upsert({
          where: { userId_gameId: { userId: decoded.userId, gameId: gameId } },
          update: { rankId: rankId || null, playstyle: playstyle || "casual" },
          create: { userId: decoded.userId, gameId: gameId, rankId: rankId || null, playstyle: playstyle || "casual" }
        });

        if (roleIds && Array.isArray(roleIds)) {
          await tx.userRole.deleteMany({ where: { userProfileId: profile.id } });
          if (roleIds.length > 0) {
            await tx.userRole.createMany({
              data: roleIds.map(id => ({ userProfileId: profile.id, roleId: id }))
            });
          }
        }
      }
    });

    return NextResponse.json({ message: "Profile updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Profile update error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}