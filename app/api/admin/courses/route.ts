import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

export async function GET() {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const courses = await prisma.course.findMany({
    include: { mainImage: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    courses.map((course) => ({
      ...course,
      mainImage: course.mainImage
        ? {
            id: course.mainImage.id,
            originalUrl: course.mainImage.originalUrl,
            webpUrl: course.mainImage.webpUrl,
          }
        : null,
    })),
  );
}

export async function POST(req: NextRequest) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, level, durationMin } = body;

  if (!name) {
    return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
  }

  const course = await prisma.course.create({
    data: {
      name,
      description,
      level,
      durationMin,
      isActive: true,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
