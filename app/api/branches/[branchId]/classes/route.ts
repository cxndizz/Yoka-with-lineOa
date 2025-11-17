import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { branchId: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const { branchId } = params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  let start: Date | undefined;
  let end: Date | undefined;

  if (dateStr) {
    const base = new Date(dateStr + 'T00:00:00Z');
    start = base;
    end = new Date(base);
    end.setUTCDate(end.getUTCDate() + 1);
  }

  const where: any = { branchId };
  if (start && end) {
    where.startAt = { gte: start, lt: end };
  }

  const classes = await prisma.classSchedule.findMany({
    where,
    include: {
      branch: true,
      course: {
        include: {
          mainImage: true,
        },
      },
      teacher: true,
      bookings: true,
    },
    orderBy: { startAt: 'asc' },
  });

  const data = classes.map((c) => ({
    id: c.id,
    start_at: c.startAt,
    end_at: c.endAt,
    status: c.status,
    capacity: c.capacity,
    booked_count: c.bookings.length,
    branch: {
      id: c.branch.id,
      name: c.branch.name,
    },
    course: {
      id: c.course.id,
      name: c.course.name,
      level: c.course.level,
      main_image_url: c.course.mainImage?.webpUrl || c.course.mainImage?.originalUrl || null,
    },
    teacher: c.teacher
      ? {
          id: c.teacher.id,
          name: c.teacher.name,
        }
      : null,
  }));

  return NextResponse.json(data);
}
