import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

interface Params {
  params: { courseId: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, level, durationMin, isActive } = body;

  const course = await prisma.course.update({
    where: { id: params.courseId },
    data: {
      name,
      description,
      level,
      durationMin,
      isActive,
    },
  });

  return NextResponse.json(course);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  await prisma.course.delete({ where: { id: params.courseId } });
  return NextResponse.json({ success: true });
}
