import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getMockMemberId() {
  const firstMember = await prisma.member.findFirst();
  return firstMember?.id || null;
}

export async function GET(_req: NextRequest) {
  const memberId = await getMockMemberId();
  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated (mock)' }, { status: 401 });
  }

  const memberPackages = await prisma.memberPackage.findMany({
    where: { memberId },
    include: {
      package: true,
    },
  });

  const data = memberPackages.map((mp) => ({
    id: mp.id,
    status: mp.status,
    remaining_sessions: mp.remainingSessions,
    started_at: mp.startedAt,
    expires_at: mp.expiresAt,
    branch_id: mp.branchId,
    package: {
      id: mp.package.id,
      name: mp.package.name,
    },
  }));

  return NextResponse.json(data);
}
