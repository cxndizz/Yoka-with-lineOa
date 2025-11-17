import { Member } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Temporary helper that mimics a logged-in member by returning
 * the first member record in the database. Replace with real
 * session / LINE Login integration in production.
 */
export async function getMockSessionMember(): Promise<Member | null> {
  const member = await prisma.member.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  return member;
}
