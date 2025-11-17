import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { omiseClient } from '@/lib/omise';

interface Params {
  params: { packageId: string };
}

async function getMockMemberId() {
  const firstMember = await prisma.member.findFirst();
  return firstMember?.id || null;
}

export async function POST(req: NextRequest, { params }: Params) {
  const memberId = await getMockMemberId();
  if (!memberId) {
    return NextResponse.json({ error: 'Not authenticated (mock)' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const branchId = body?.branch_id as string | undefined;

  const pack = await prisma.package.findUnique({
    where: { id: params.packageId },
  });

  if (!pack || !pack.isActive) {
    return NextResponse.json({ error: 'Package not available' }, { status: 404 });
  }

  if (pack.scope === 'branch_only' && pack.branchId && branchId && pack.branchId !== branchId) {
    return NextResponse.json({ error: 'Package not valid for this branch' }, { status: 400 });
  }

  const amountSatang = Number(pack.price) * 100;

  const member = await prisma.member.findUnique({ where: { id: memberId } });

  // Create a pending memberPackage
  const memberPackage = await prisma.memberPackage.create({
    data: {
      memberId,
      packageId: pack.id,
      branchId: branchId || pack.branchId,
      status: 'pending',
    },
  });

  const payment = await prisma.payment.create({
    data: {
      memberId,
      memberPackageId: memberPackage.id,
      amount: pack.price,
      currency: pack.currency,
      status: 'pending',
    },
  });

  if (!omiseClient) {
    return NextResponse.json(
      { error: 'Omise is not configured on the server.' },
      { status: 500 },
    );
  }

  try {
    const charge = await omiseClient.charges.create({
      amount: amountSatang,
      currency: pack.currency.toLowerCase(),
      description: `Yoga package: ${pack.name} for member ${member?.lineDisplayName || memberId}`,
      metadata: {
        paymentId: payment.id,
        memberPackageId: memberPackage.id,
      },
      // For real integration you may need a source or card token from frontend.
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerChargeId: charge.id,
        rawPayload: charge as any,
      },
    });

    return NextResponse.json({
      payment_id: payment.id,
      provider: 'omise',
      omise: {
        charge_id: charge.id,
        authorized: charge.authorized,
        paid: charge.paid,
        status: charge.status,
      },
    });
  } catch (error: any) {
    console.error(error);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        rawPayload: error,
      },
    });

    return NextResponse.json({ error: 'Failed to create charge' }, { status: 500 });
  }
}
