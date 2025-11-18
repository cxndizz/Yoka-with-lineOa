'use client';

import { useEffect, useRef, useState } from 'react';

interface LineProfile {
  displayName: string;
  userId: string;
  pictureUrl?: string;
}

async function loadLiffSdk(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).liff) {
    return (window as any).liff;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).liff) {
        resolve((window as any).liff);
      } else {
        reject(new Error('ไม่สามารถโหลด LIFF SDK'));
      }
    };
    script.onerror = () => reject(new Error('โหลด LIFF SDK ไม่สำเร็จ'));
    document.body.appendChild(script);
  });
}

interface SessionSummary {
  token: string;
  referenceId: string;
  displayName?: string | null;
  metadata?: Record<string, any>;
  lastSeenAt: string;
  expiresAt: string;
}

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

type StatusState = 'checking' | 'loading' | 'ready' | 'error' | 'prompt-login';

export default function RichMenuEntry() {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [status, setStatus] = useState<StatusState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [liffApp, setLiffApp] = useState<any | null>(null);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [, setConnectionState] = useState<ConnectionState>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/auth/session?role=customer', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            setStatus('prompt-login');
          }
          return;
        }
        const payload = await res.json();
        if (!cancelled) {
          setSession(payload.session);
          setStatus('ready');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setStatus('prompt-login');
        }
      }
    }

    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session) {
      setProfile((prev) => {
        if (prev) return prev;
        return {
          displayName: session.displayName || 'LINE Member',
          userId: (session.metadata?.lineUserId as string) || session.referenceId,
          pictureUrl: session.metadata?.pictureUrl as string | undefined,
        };
      });
      startRealtime(session.token);
      return;
    }

    socketRef.current?.close();
    if (typeof window !== 'undefined' && heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setConnectionState('disconnected');
  }, [session]);

  useEffect(() => {
    if (session || status === 'checking') {
      return;
    }

    let cancelled = false;

    async function bootstrapLiff() {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID ใน .env');
        setStatus('error');
        return;
      }
      setError(null);
      setStatus('loading');
      try {
        const liff = await loadLiffSdk();
        if (!liff) {
          throw new Error('ไม่พบ LIFF object ใน window');
        }
        await liff.init({ liffId });
        if (cancelled) return;
        setLiffApp(liff);
        if (!liff.isLoggedIn()) {
          setStatus('prompt-login');
          return;
        }
        const liffProfile = await liff.getProfile();
        const profilePayload: LineProfile = {
          userId: liffProfile.userId,
          displayName: liffProfile.displayName,
          pictureUrl: liffProfile.pictureUrl,
        };
        setProfile(profilePayload);
        const response = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId: profilePayload.userId,
            displayName: profilePayload.displayName,
            pictureUrl: profilePayload.pictureUrl,
          }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'ไม่สามารถสร้างเซสชันได้');
        }
        const authPayload = await response.json();
        if (!cancelled) {
          setSession(authPayload.session);
          setStatus('ready');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'ไม่สามารถเชื่อมต่อ LIFF');
          setStatus('error');
        }
      }
    }

    bootstrapLiff();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  async function handleLogin() {
    if (!liffApp) {
      setError('ยังไม่พบ LIFF SDK บนหน้านี้');
      return;
    }
    setError(null);
    setStatus('loading');
    liffApp.login({});
  }

  function handleContinue() {
    window.location.href = '/branches';
  }

  function startRealtime(token: string) {
    if (typeof window === 'undefined') return;
    if (socketRef.current) {
      socketRef.current.close();
    }
    setConnectionState('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/realtime/session?token=${token}&role=customer`);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnectionState('connected');
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'session:update') {
          setSession(payload.session);
        }
        if (payload?.type === 'session:expired') {
          setSession(null);
          setStatus('prompt-login');
        }
      } catch {
        // ignore invalid payload
      }
    });

    socket.addEventListener('close', () => {
      setConnectionState('disconnected');
    });

    if (heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 10000);
  }

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      if (typeof window !== 'undefined' && heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  return (
    <section className="liff-section">
      <div className="liff-hero">
        <div>
          <p className="liff-hero__eyebrow">Yoga On-The-Go</p>
          <h1>เริ่มจองคลาสโยคะผ่าน LINE</h1>
          <p>
            เปิดเมนูนี้จาก Rich Menu เพื่อเข้าสู่พื้นที่ลูกค้าของ Yoga Club และจองคอร์สในสาขาโปรดได้ทันที เพียงล็อกอินด้วยบัญชี LINE ของคุณ
          </p>
          <div className="cta-row">
            {status === 'ready' ? (
              <button type="button" className="primary-btn" onClick={handleContinue}>
                ไปยังหน้าจองคลาส
              </button>
            ) : (
              <button type="button" className="primary-btn" onClick={handleLogin} disabled={status === 'loading'}>
                {status === 'loading' ? 'กำลังเชื่อมต่อ...' : 'ล็อกอินผ่าน LINE'}
              </button>
            )}
            <a className="ghost-btn" href="/packages">
              ดูแพ็กเกสุดคุ้ม
            </a>
          </div>
        </div>
      </div>

      <div className="liff-grid">
        <div className="liff-card">
          <h3>จองง่ายภายใน 3 ขั้นตอน</h3>
          <ol>
            <li>ล็อกอินด้วย LINE แล้วเลือกสาขา</li>
            <li>ดูตารางเรียนที่ยังว่างและกดจอง</li>
            <li>ชำระเงินผ่าน Omise ได้ทันทีใน LIFF</li>
          </ol>
        </div>
        <div className="liff-card">
          <h3>แพ็กเกจแนะนำ</h3>
          <p>สะสมคอร์สโปรดในแพ็กเกจ 5 / 10 ครั้ง หรือเลือกแบบรายเดือน</p>
          <a href="/packages" className="link-button">
            เปิดดูแพ็กเกจ
          </a>
        </div>
        <div className="liff-card">
          <h3>สาขาใกล้คุณ</h3>
          <p>ตรวจสอบคลาสว่างได้ทุกสาขา ทั้งสาขาเมือง ชั้นดาดฟ้า และริมทะเล</p>
          <a href="/branches" className="link-button">
            ดูแผนที่สาขา
          </a>
        </div>
      </div>
    </section>
  );
}
