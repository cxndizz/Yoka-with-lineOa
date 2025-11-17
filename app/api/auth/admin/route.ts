import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createSession, deleteSession, serializeSession, touchSession } from '@/lib/realtime-session';

const ADMIN_SESSION_COOKIE = 'admin_session';

function getCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || 'admin@yogaclub.com',
    password: process.env.ADMIN_PASSWORD || 'supersecret',
  };
}

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = cookieToken ? touchSession(cookieToken, 'admin') : null;

  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  return NextResponse.json({ session: serializeSession(session) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body || {};

  const expected = getCredentials();

  if (email !== expected.email || password !== expected.password) {
    return NextResponse.json({ error: 'invalid-credentials' }, { status: 401 });
  }

  const session = createSession({
    role: 'admin',
    referenceId: expected.email,
    displayName: 'Backoffice Admin',
    metadata: { email },
    ttlMs: 1000 * 60 * 60,
  });

  const response = NextResponse.json({ session: serializeSession(session) });
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 60 * 60,
  });

  cookies().set({
    name: ADMIN_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 60 * 60,
  });

  return response;
}

export async function DELETE(req: NextRequest) {
  const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (cookieToken) {
    deleteSession(cookieToken);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
  cookies().set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}
