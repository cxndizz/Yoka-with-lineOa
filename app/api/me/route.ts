import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMockSessionMember } from '@/lib/mock-auth';

export async function GET(_req: NextRequest) {
  const member = await getMockSessionMember();

  if (!member) {
    return NextResponse.json({ error: 'Not authenticated (mock)' }, { status: 401 });
  }

  const safeMember = await prisma.member.findUnique({
    where: { id: member.id },
    select: {
      id: true,
      lineDisplayName: true,
      linePictureUrl: true,
      email: true,
      homeBranchId: true,
      isAdmin: true,
    },
  });

  if (!safeMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  return NextResponse.json(safeMember);
}
