import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, serializeSession, touchSession } from '@/lib/realtime-session';

const COOKIE_NAMES = {
  customer: 'customer_session',
  admin: 'admin_session',
};

type RoleParam = keyof typeof COOKIE_NAMES;

function getRole(req: NextRequest): RoleParam | null {
  const role = req.nextUrl.searchParams.get('role');
  if (role === 'customer' || role === 'admin') {
    return role;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const role = getRole(req);
  if (!role) {
    return NextResponse.json({ error: 'missing-role' }, { status: 400 });
  }

  const cookieToken = req.cookies.get(COOKIE_NAMES[role])?.value;
  const session = cookieToken ? touchSession(cookieToken, role) : null;

  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  return NextResponse.json({ session: serializeSession(session) });
}

export async function DELETE(req: NextRequest) {
  const role = getRole(req);
  if (!role) {
    return NextResponse.json({ error: 'missing-role' }, { status: 400 });
  }

  const cookieToken = req.cookies.get(COOKIE_NAMES[role])?.value;
  if (cookieToken) {
    deleteSession(cookieToken);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAMES[role],
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
  cookies().set({
    name: COOKIE_NAMES[role],
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
  });
  return response;
}
