import type { Member } from '@prisma/client';
import { prisma } from './prisma';
import { getMockSessionMember } from './mock-auth';

/**
 * Ensures that the current session belongs to an admin user.
 * Returns the member record if authorized or null if unauthorized.
 */
export async function authorizeAdmin(): Promise<Member | null> {
  const member = await getMockSessionMember();
  if (!member) {
    return null;
  }

  if (member.isAdmin) {
    return member;
  }

  const adminExists = await prisma.member.count({ where: { isAdmin: true } });
  if (adminExists === 0) {
    const elevated = await prisma.member.update({
      where: { id: member.id },
      data: { isAdmin: true },
    });
    return elevated;
  }

  return null;
}
