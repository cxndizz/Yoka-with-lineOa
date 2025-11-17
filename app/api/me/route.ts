import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// NOTE: This is a placeholder.
// In a real system you should get memberId from auth (cookie / header / session).
async function getMockMemberId() {
  const firstMember = await prisma.member.findFirst();
  return firstMember?.id || null;
}

export async function GET(_req: NextRequest) {
  const memberId = await getMockMemberId();

  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated (mock)' }, { status: 401 });
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      lineDisplayName: true,
      linePictureUrl: true,
      email: true,
      homeBranchId: true,
      isAdmin: true,
    },
  });

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  return NextResponse.json(member);
}
