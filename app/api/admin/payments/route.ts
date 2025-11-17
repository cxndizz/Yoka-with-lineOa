import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

export async function GET() {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    include: { member: true, memberPackage: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { memberId, memberPackageId, bookingId, amount, currency, status, provider } = body;

  if (!memberId || !amount || !currency) {
    return NextResponse.json({ error: 'memberId, amount และ currency จำเป็น' }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      memberId,
      memberPackageId,
      bookingId,
      amount: new Prisma.Decimal(amount),
      currency,
      status: status || 'pending',
      provider: provider || 'manual',
    },
    include: { member: true, memberPackage: true },
  });

  return NextResponse.json(payment, { status: 201 });
}
