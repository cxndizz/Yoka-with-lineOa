import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, deleteSession, serializeSession, touchSession } from '@/lib/realtime-session';

const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_LINE_USER_ID = process.env.ADMIN_LINE_USER_ID || 'admin-line-user';

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

  const adminMember = await prisma.member.upsert({
    where: { lineUserId: ADMIN_LINE_USER_ID },
    update: {
      isAdmin: true,
      email: expected.email,
      lineDisplayName: 'Backoffice Admin',
    },
    create: {
      lineUserId: ADMIN_LINE_USER_ID,
      lineDisplayName: 'Backoffice Admin',
      email: expected.email,
      isAdmin: true,
    },
  });

  const session = createSession({
    role: 'admin',
    referenceId: adminMember.id,
    displayName: adminMember.lineDisplayName ?? 'Backoffice Admin',
    metadata: { email, memberId: adminMember.id },
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
