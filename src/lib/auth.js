import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/**
 * Server-side helper: reads the JWT cookie, verifies it, and returns the user.
 * Use in Server Components and API routes.
 *
 * @returns {{ user: object } | null}
 */
export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('queuemate_session')?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        globalRating: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    return { user };
  } catch (error) {
    return null;
  }
}

/**
 * Server-side helper: verifies user is an ADMIN.
 * Returns the user if admin, null otherwise.
 */
export async function requireAdmin() {
  const auth = await getAuthUser();
  if (!auth || auth.user.role !== 'ADMIN') return null;
  return auth;
}
