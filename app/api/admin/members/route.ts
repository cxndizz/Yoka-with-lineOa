import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';
import { randomUUID } from 'crypto';

export async function GET() {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const members = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { lineDisplayName, email, phone, homeBranchId, lineUserId } = body;

  const newMember = await prisma.member.create({
    data: {
      lineDisplayName,
      email,
      phone,
      homeBranchId,
      lineUserId: lineUserId || `admin-created-${randomUUID()}`,
    },
  });

  return NextResponse.json(newMember, { status: 201 });
}
