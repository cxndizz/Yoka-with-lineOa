import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/lib/admin-auth';

export async function GET() {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const branches = await prisma.branch.findMany({
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const member = await authorizeAdmin();
  if (!member) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, address, phone, locationInfo } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
  }

  try {
    const branch = await prisma.branch.create({
      data: {
        name,
        slug,
        address,
        phone,
        locationInfo,
        isActive: true,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
