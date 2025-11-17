import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateMemberFromLineProfile } from '@/lib/auth';
import { createSession, serializeSession } from '@/lib/realtime-session';

const CUSTOMER_SESSION_COOKIE = 'customer_session';

// This is a simplified example.
// In production you should verify the LINE id_token / access_token properly.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const lineUserId = body?.lineUserId ?? body?.line_user_id;

  if (!body || !lineUserId) {
    return NextResponse.json({ error: 'Missing lineUserId' }, { status: 400 });
  }

  const member = await findOrCreateMemberFromLineProfile({
    lineUserId,
    displayName: body.displayName ?? body.display_name,
    pictureUrl: body.pictureUrl ?? body.picture_url,
    email: body.email,
  });

  const session = createSession({
    role: 'customer',
    referenceId: member.id,
    displayName: member.lineDisplayName ?? member.email ?? 'LINE Member',
    metadata: {
      memberId: member.id,
      lineUserId: member.lineUserId,
      pictureUrl: body.pictureUrl ?? body.picture_url ?? member.linePictureUrl,
    },
  });

  const response = NextResponse.json({ member, session: serializeSession(session) });
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: CUSTOMER_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 60 * 30,
  });

  // also update request cookies for subsequent handlers in the same request lifecycle
  cookies().set({
    name: CUSTOMER_SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 60 * 30,
  });

  return response;
}
