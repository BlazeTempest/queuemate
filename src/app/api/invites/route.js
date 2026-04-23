import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import jwt from 'jsonwebtoken';

// 1. GET: Fetch all pending incoming invites for the logged-in user
export async function GET(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const invites = await prisma.invite.findMany({
      where: { 
        receiverId: decoded.userId, 
        status: 'PENDING' 
      },
      include: {
        game: true,
        sender: {
          include: {
            profiles: {
              include: { rank: true } 
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedInvites = invites.map(inv => {
      const senderProfile = inv.sender.profiles.find(p => p.gameId === inv.gameId);
      
      return {
        id: inv.id,
        senderId: inv.sender.id,
        from: inv.sender.username,
        avatar: inv.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.sender.username}`,
        game: inv.game.name,
        rank: senderProfile?.rank?.name || 'Unranked',
        time: new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });

    return NextResponse.json(formattedInvites, { status: 200 });

  } catch (error) {
    console.error("Fetch Invites Error:", error);
    return NextResponse.json({ error: "Failed to load invites" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { inviteId, action } = await request.json();

    // 1. We added 'include: { game: true }' here so we know the name of the game being played
    const invite = await prisma.invite.findUnique({ 
      where: { id: inviteId },
      include: { game: true } 
    });
    
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

    if (action === 'REJECT') {
      await prisma.invite.update({
        where: { id: inviteId },
        data: { status: 'REJECTED' }
      });
      return NextResponse.json({ message: 'Invite rejected' }, { status: 200 });
    }

    if (action === 'ACCEPT') {
      const result = await prisma.$transaction(async (tx) => {
        await tx.invite.update({
          where: { id: inviteId },
          data: { status: 'ACCEPTED' }
        });

        const match = await tx.match.create({
          data: {
            gameId: invite.gameId,
            status: 'ACTIVE',
            members: {
              create: [
                { userId: invite.senderId },
                { userId: invite.receiverId }
              ]
            }
          }
        });
        return match;
      });

      // 2. Fetch the accepter's profile data so we can send it back to the sender!
      const accepter = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          profiles: {
            where: { gameId: invite.gameId },
            include: { rank: true }
          }
        }
      });

      const accepterProfile = accepter.profiles[0];

      // 3. PUSHER MAGIC: Send the full player profile back to the sender
      await pusherServer.trigger(`user-${invite.senderId}`, 'invite-accepted', {
        matchId: result.id,
        player: {
          id: accepter.id,
          username: accepter.username,
          avatar: accepter.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${accepter.username}`,
          game: invite.game.name,
          rank: accepterProfile?.rank?.name || 'Unranked',
          online: true
        }
      });

      return NextResponse.json({ message: "Match created", matchId: result.id }, { status: 200 });
    }

  } catch (error) {
    console.error("Respond Invite Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. POST: Send a new invite to another player
export async function POST(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { receiverId, gameId } = await request.json();

    if (decoded.userId === receiverId) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    const existingInvite = await prisma.invite.findFirst({
      where: { 
        senderId: decoded.userId, 
        receiverId: receiverId, 
        status: 'PENDING' 
      }
    });

    if (existingInvite) {
      return NextResponse.json({ error: "Invite already pending" }, { status: 409 });
    }

    const newInvite = await prisma.invite.create({
      data: {
        senderId: decoded.userId,
        receiverId: receiverId,
        gameId: gameId
      },
      include: {
        game: true,
        sender: {
          include: {
            profiles: {
              where: { gameId: gameId },
              include: { rank: true }
            }
          }
        }
      }
    });

    const senderProfile = newInvite.sender.profiles[0];
    
    await pusherServer.trigger(`user-${receiverId}`, 'new-invite', {
      id: newInvite.id,
      senderId: newInvite.sender.id,
      from: newInvite.sender.username,
      avatar: newInvite.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newInvite.sender.username}`,
      game: newInvite.game.name,
      rank: senderProfile?.rank?.name || 'Unranked',
      time: new Date(newInvite.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    return NextResponse.json({ message: "Invite sent successfully" }, { status: 201 });

  } catch (error) {
    console.error("Send Invite Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}