import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branch_id');

  const where: any = { isActive: true };
  if (branchId) {
    where.OR = [
      { scope: 'global' },
      { scope: 'branch_only', branchId },
    ];
  }

  const packages = await prisma.package.findMany({
    where,
    orderBy: { price: 'asc' },
  });

  return NextResponse.json(
    packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      package_type: p.packageType,
      total_sessions: p.totalSessions,
      duration_days: p.durationDays,
      price: p.price,
      currency: p.currency,
      scope: p.scope,
      branch_id: p.branchId,
    })),
  );
}
