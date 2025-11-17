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

  const bookings = await prisma.booking.findMany({
    where: { memberId },
    include: {
      classSchedule: {
        include: {
          branch: true,
          course: true,
          teacher: true,
        },
      },
    },
    orderBy: { bookedAt: 'desc' },
  });

  const data = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    booked_at: b.bookedAt,
    class: {
      id: b.classSchedule.id,
      start_at: b.classSchedule.startAt,
      end_at: b.classSchedule.endAt,
      branch_name: b.classSchedule.branch.name,
      course_name: b.classSchedule.course.name,
      teacher_name: b.classSchedule.teacher?.name ?? null,
    },
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const memberId = await getMockMemberId();
  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated (mock)' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.class_schedule_id) {
    return NextResponse.json({ error: 'Missing class_schedule_id' }, { status: 400 });
  }

  const classSchedule = await prisma.classSchedule.findUnique({
    where: { id: body.class_schedule_id },
    include: { bookings: true },
  });

  if (!classSchedule) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  const bookedCount = classSchedule.bookings.length;
  const capacity = classSchedule.capacity ?? 9999;
  if (bookedCount >= capacity) {
    return NextResponse.json({ error: 'Class is full' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        memberId,
        classScheduleId: classSchedule.id,
        status: 'booked',
      },
    });

    return NextResponse.json({ id: booking.id, status: booking.status }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
