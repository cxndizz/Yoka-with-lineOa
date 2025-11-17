import { NextRequest, NextResponse } from 'next/server';
import { serializeSession, touchSession } from '@/lib/realtime-session';

type SessionRole = 'admin' | 'customer';

function parseRole(value: unknown): SessionRole | undefined {
  return value === 'admin' || value === 'customer' ? value : undefined;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = body?.token;
  const role = parseRole(body?.role);

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'missing-token' }, { status: 400 });
  }

  const session = touchSession(token, role);
  if (!session) {
    return NextResponse.json({ error: 'session-not-found' }, { status: 404 });
  }

  return NextResponse.json({ session: serializeSession(session) });
}
