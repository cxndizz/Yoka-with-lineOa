import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

interface Params {
  params: { branchId: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, address, phone, locationInfo, isActive } = body;

  const branch = await prisma.branch.update({
    where: { id: params.branchId },
    data: {
      name,
      slug,
      address,
      phone,
      locationInfo,
      isActive,
    },
  });

  return NextResponse.json(branch);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  await prisma.branch.delete({ where: { id: params.branchId } });
  return NextResponse.json({ success: true });
}
