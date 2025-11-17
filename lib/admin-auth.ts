import type { Member } from '@prisma/client';
import { getMockSessionMember } from './mock-auth';

/**
 * Ensures that the current session belongs to an admin user.
 * Returns the member record if authorized or null if unauthorized.
 */
export async function authorizeAdmin(): Promise<Member | null> {
  const member = await getMockSessionMember();
  if (!member || !member.isAdmin) {
    return null;
  }
  return member;
}
