import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

interface Params {
  params: { memberId: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { lineDisplayName, email, phone, homeBranchId, isAdmin } = body;

  const updatedMember = await prisma.member.update({
    where: { id: params.memberId },
    data: {
      lineDisplayName,
      email,
      phone,
      homeBranchId,
      isAdmin,
    },
  });

  return NextResponse.json(updatedMember);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  await prisma.member.delete({ where: { id: params.memberId } });
  return NextResponse.json({ success: true });
}
