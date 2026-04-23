import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const token = request.cookies.get('queuemate_session')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Using your exact schema field names: ratedUserId and rating
    const { matchId, ratedUserId, rating } = await request.json();

    if (!matchId || !ratedUserId || !rating) {
      return NextResponse.json({ error: "Missing rating data" }, { status: 400 });
    }

    // 1. Ensure the match is actually completed
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== 'COMPLETED') {
      return NextResponse.json({ error: "Match is not completed yet" }, { status: 400 });
    }

    // 2. Prevent double rating (since you don't have the @@unique constraint in your schema)
    const existingRating = await prisma.rating.findFirst({
      where: { matchId: matchId, raterId: decoded.userId }
    });

    if (existingRating) {
      return NextResponse.json({ error: "You have already rated this match" }, { status: 409 });
    }

    // 3. Save the rating to the database
    await prisma.rating.create({
      data: {
        matchId: matchId,
        raterId: decoded.userId,
        ratedUserId: ratedUserId,
        rating: parseInt(rating)
      }
    });

    // 4. BONUS: Automatically recalculate and update their globalRating!
    const allRatings = await prisma.rating.aggregate({
      where: { ratedUserId: ratedUserId },
      _avg: { rating: true }
    });

    if (allRatings._avg.rating) {
      await prisma.user.update({
        where: { id: ratedUserId },
        data: { globalRating: allRatings._avg.rating }
      });
    }

    return NextResponse.json({ message: "Rating submitted successfully" }, { status: 201 });

  } catch (error) {
    console.error("Rating Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}