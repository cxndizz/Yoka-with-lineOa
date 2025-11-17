import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { bookingId: string };
}

async function getMockMemberId() {
  const firstMember = await prisma.member.findFirst();
  return firstMember?.id || null;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const memberId = await getMockMemberId();
  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated (mock)' }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });

  if (!booking || booking.memberId !== memberId) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
