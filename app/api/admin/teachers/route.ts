import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

export async function GET() {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const teachers = await prisma.teacher.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, bio, avatarUrl } = body;

  if (!name) {
    return NextResponse.json({ error: 'ชื่อเทรนเนอร์จำเป็นต้องกรอก' }, { status: 400 });
  }

  const teacher = await prisma.teacher.create({
    data: {
      name,
      bio,
      avatarUrl,
    },
  });

  return NextResponse.json(teacher, { status: 201 });
}
