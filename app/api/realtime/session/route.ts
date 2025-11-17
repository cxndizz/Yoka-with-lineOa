import { NextRequest } from 'next/server';
import { serializeSession, touchSession } from '@/lib/realtime-session';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const role = (searchParams.get('role') as 'admin' | 'customer' | null) ?? undefined;

  const session = token ? touchSession(token, role) : null;
  if (!session) {
    return new Response('Session not found', { status: 401 });
  }

  const pair = new (globalThis as any).WebSocketPair();
  const client = pair[0] as WebSocket;
  const server = pair[1] as WebSocket;
  (server as any).accept();

  const sendSession = () => {
    const refreshed = touchSession(token, role);
    if (!refreshed) {
      server.send(JSON.stringify({ type: 'session:expired' }));
      server.close(4401, 'Session expired');
      return false;
    }
    server.send(
      JSON.stringify({
        type: 'session:update',
        session: serializeSession(refreshed),
      }),
    );
    return true;
  };

  sendSession();

  const interval = setInterval(() => {
    if (!sendSession()) {
      clearInterval(interval);
    }
  }, 15000);

  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const payload = JSON.parse(event.data as string);
      if (payload?.type === 'heartbeat') {
        sendSession();
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
