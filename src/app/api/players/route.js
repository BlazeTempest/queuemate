import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // 1. Get current user ID to exclude them from the list
    const token = request.cookies.get('queuemate_session')?.value;
    let currentUserId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (e) {
        // Ignore invalid tokens, just means user isn't fully authenticated
      }
    }

    // 2. Fetch all profiles including their nested User, Game, Rank, and Role data
    const profiles = await prisma.userProfile.findMany({
      include: {
        user: true,
        game: true,
        rank: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // 3. Map the database structure into the exact flat format MOCK_PLAYERS used
    const mappedPlayers = profiles.map(p => ({
      id: p.user.id,
      username: p.user.username,
      avatar: p.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.username}`,
      globalRating: p.user.globalRating,
      status: p.user.status, // "ONLINE", "OFFLINE", "IN_GAME"
      playstyle: p.playstyle,
      
      // IDs used for the filtering logic
      game: p.game.id,
      rank: p.rank?.id || null,
      roles: p.roles.map(r => r.role.id),
      
      // String names in case your PlayerCard uses them for display
      gameName: p.game.name,
      rankName: p.rank?.name || 'Unranked',
      roleNames: p.roles.map(r => r.role.name)
    }));

    // 4. Filter out the current user
    const finalPlayers = currentUserId 
      ? mappedPlayers.filter(p => p.id !== currentUserId)
      : mappedPlayers;

    return NextResponse.json(finalPlayers, { status: 200 });

  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}