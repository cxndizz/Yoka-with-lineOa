import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

interface Params {
  params: { paymentId: string };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { amount, currency, status, provider, providerChargeId } = body;

  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      amount: amount !== undefined ? new Prisma.Decimal(amount) : undefined,
      currency,
      status,
      provider,
      providerChargeId,
    },
    include: { member: true, memberPackage: true },
  });

  return NextResponse.json(payment);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  await prisma.payment.delete({ where: { id: params.paymentId } });
  return NextResponse.json({ success: true });
}
