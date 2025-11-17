import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateMemberFromLineProfile } from '@/lib/auth';

// This is a simplified example.
// In production you should verify the LINE id_token / access_token properly.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || !body.line_user_id) {
    return NextResponse.json({ error: 'Missing line_user_id' }, { status: 400 });
  }

  const member = await findOrCreateMemberFromLineProfile({
    lineUserId: body.line_user_id,
    displayName: body.display_name,
    pictureUrl: body.picture_url,
    email: body.email,
  });

  // TODO: generate a proper signed token / session.
  // For now we just return the member data.
  return NextResponse.json({ member });
}
