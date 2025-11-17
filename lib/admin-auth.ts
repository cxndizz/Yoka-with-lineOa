import { cookies } from 'next/headers';
import type { Member } from '@prisma/client';
import { prisma } from './prisma';
import { validateSession } from './realtime-session';

const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Ensures that the current session belongs to an admin user.
 * Returns the member record if authorized or null if unauthorized.
 */
export async function authorizeAdmin(): Promise<Member | null> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const session = validateSession(token, 'admin');
  if (!session) {
    return null;
  }

  if (session.metadata?.memberId) {
    const member = await prisma.member.findUnique({ where: { id: session.metadata.memberId } });
    if (member?.isAdmin) {
      return member;
    }
  }

  if (session.referenceId) {
    const fallback = await prisma.member.findFirst({
      where: {
        isAdmin: true,
        OR: [
          { id: session.referenceId },
          { email: session.referenceId },
          { lineUserId: session.referenceId },
        ],
      },
    });
    if (fallback) {
      return fallback;
    }
  }

  return null;
}
