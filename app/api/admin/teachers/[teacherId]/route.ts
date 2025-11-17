import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

interface Params {
  params: { teacherId: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, bio, avatarUrl } = body;

  const teacher = await prisma.teacher.update({
    where: { id: params.teacherId },
    data: {
      name,
      bio,
      avatarUrl,
    },
  });

  return NextResponse.json(teacher);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  await prisma.teacher.delete({ where: { id: params.teacherId } });
  return NextResponse.json({ success: true });
}
