import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

export async function GET() {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const schedules = await prisma.classSchedule.findMany({
    include: {
      branch: true,
      course: true,
      teacher: true,
    },
    orderBy: { startAt: 'asc' },
    take: 20,
  });

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { branchId, courseId, teacherId, startAt, endAt, capacity } = body;

  if (!branchId || !courseId || !startAt || !endAt) {
    return NextResponse.json({ error: 'branchId, courseId, startAt and endAt are required' }, { status: 400 });
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return NextResponse.json({ error: 'Invalid start/end datetime' }, { status: 400 });
  }

  const classSchedule = await prisma.classSchedule.create({
    data: {
      branchId,
      courseId,
      teacherId,
      startAt: startDate,
      endAt: endDate,
      capacity,
    },
    include: {
      branch: true,
      course: true,
      teacher: true,
    },
  });

  return NextResponse.json(classSchedule, { status: 201 });
}
