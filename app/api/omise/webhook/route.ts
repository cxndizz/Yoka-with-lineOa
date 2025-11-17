import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// NOTE: For real security, validate Omise webhook signature here.

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    if (payload.object === 'event' && payload.data && payload.key === 'charge.complete') {
      const charge = payload.data;
      const chargeId = charge.id as string | undefined;

      if (!chargeId) {
        return NextResponse.json({ ok: true });
      }

      const payment = await prisma.payment.findFirst({
        where: { providerChargeId: chargeId },
      });

      if (!payment) {
        return NextResponse.json({ ok: true });
      }

      const status = charge.paid ? 'paid' : charge.failed ? 'failed' : payment.status;

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          rawPayload: charge,
        },
      });

      if (status === 'paid' && payment.memberPackageId) {
        const memberPackage = await prisma.memberPackage.findUnique({
          where: { id: payment.memberPackageId },
          include: { package: true },
        });

        if (memberPackage && memberPackage.package) {
          const now = new Date();
          const durationDays = memberPackage.package.durationDays;
          const expiresAt =
            durationDays != null ? new Date(now.getTime() + durationDays * 86400000) : null;

          await prisma.memberPackage.update({
            where: { id: memberPackage.id },
            data: {
              status: 'active',
              startedAt: now,
              expiresAt,
              remainingSessions: memberPackage.package.totalSessions ?? memberPackage.remainingSessions,
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
