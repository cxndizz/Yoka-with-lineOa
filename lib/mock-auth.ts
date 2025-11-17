import { Member } from '@prisma/client';
import { prisma } from './prisma';
import { APP_PROFILE } from './app-profile';

/**
 * Temporary helper that mimics a logged-in member by returning
 * the first member record in the database. Replace with real
 * session / LINE Login integration in production.
 */
export async function getMockSessionMember(): Promise<Member | null> {
  const adminPreferred = APP_PROFILE === 'admin';

  const member = await prisma.member.findFirst({
    where: adminPreferred ? { isAdmin: true } : undefined,
    orderBy: { createdAt: 'asc' },
  });

  if (member) {
    return adminPreferred ? { ...member, isAdmin: true } : member;
  }

  if (adminPreferred) {
    // Allow the admin portal to function even if the seed data does not yet
    // include an admin member. The first member acts as a temporary admin.
    const fallbackMember = await prisma.member.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    return fallbackMember ? { ...fallbackMember, isAdmin: true } : null;
  }

  return null;
}
