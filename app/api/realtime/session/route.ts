import { NextRequest } from 'next/server';

export const runtime = 'edge';

type SessionRole = 'admin' | 'customer';

async function fetchSession(req: NextRequest, token: string, role?: SessionRole | null) {
  const baseUrl = process.env.APP_BASE_URL || req.nextUrl.origin;
  const url = new URL('/api/realtime/internal/touch', baseUrl);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, role }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  return payload?.session ?? null;
}

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const { searchParams } = req.nextUrl;
  const token = searchParams.get('token');
  const role = (searchParams.get('role') as SessionRole | null) ?? null;

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const pair = new (globalThis as any).WebSocketPair();
  const client = pair[0] as WebSocket;
  const server = pair[1] as WebSocket;
  (server as any).accept();

  const sendSession = async () => {
    const refreshed = await fetchSession(req, token, role);
    if (!refreshed) {
      server.send(JSON.stringify({ type: 'session:expired' }));
      server.close(4401, 'Session expired');
      return false;
    }
    server.send(
      JSON.stringify({
        type: 'session:update',
        session: refreshed,
      }),
    );
    return true;
  };

  await sendSession();

  const interval = setInterval(async () => {
    if (!(await sendSession())) {
      clearInterval(interval);
    }
  }, 15000);

  server.addEventListener('message', async (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data as string);
      if (payload?.type === 'heartbeat') {
        await sendSession();
      }
    } catch {
      // ignore malformed payloads
    }
  });

  server.addEventListener('close', () => {
    clearInterval(interval);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
