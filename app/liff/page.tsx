'use client';

import { useEffect, useState } from 'react';

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
        reject(new Error('ไม่สามารถโหลด LIFF SDK')); // fallback
      }
    };
    script.onerror = () => reject(new Error('โหลด LIFF SDK ไม่สำเร็จ'));
    document.body.appendChild(script);
  });
}

export default function LiffEntryPage() {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mockMember, setMockMember] = useState<any>(null);

  useEffect(() => {
    async function bootstrap() {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID ใน .env');
        return;
      }
      setStatus('loading');
      try {
        const liff = await loadLiffSdk();
        if (!liff) {
          setError('ไม่พบ LIFF object ใน window');
          setStatus('error');
          return;
        }
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login({});
          return;
        }
        const liffProfile = await liff.getProfile();
        const payload = {
          lineUserId: liffProfile.userId,
          displayName: liffProfile.displayName,
          pictureUrl: liffProfile.pictureUrl,
        };
        setProfile(payload);
        await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setStatus('ready');
      } catch (err: any) {
        setError(err.message);
        setStatus('error');
      }
    }

    bootstrap();
  }, []);

  async function loadMockMember() {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      setMockMember(data);
    }
  }

  return (
    <section>
      <div className="hero">
        <div>
          <p className="tag">LIFF entry</p>
          <h1>เชื่อมต่อ LINE OA → Booking</h1>
          <p>
            หน้า /liff นี้ถูกเตรียมไว้ให้ Rich Menu เปิดมาที่ LIFF ID ของคุณ จากนั้นโหลด SDK, ดึงโปรไฟล์
            และส่งเข้า /api/auth/line ตามที่ README.md อธิบาย.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>สถานะ</h3>
        <p>State: {status}</p>
        {profile && (
          <div className="user-pill" style={{ marginTop: 12 }}>
            {profile.pictureUrl ? (
              <img src={profile.pictureUrl} alt={profile.displayName} />
            ) : (
              <div className="avatar-fallback">{profile.displayName?.charAt(0)}</div>
            )}
            <div>
              <p>{profile.displayName}</p>
              <span>{profile.userId}</span>
            </div>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <p>
          หากทดสอบใน dev และยังไม่ได้ตั้งค่า LIFF จริง สามารถกดดู mock member ที่ /api/me เพื่อเช็ก session
          ชั่วคราวได้.
        </p>
        <button type="button" className="ghost-btn" onClick={loadMockMember}>
          โหลด mock member
        </button>
        {mockMember && (
          <pre style={{ marginTop: 12, background: '#0f172a', color: '#fff', padding: 12, borderRadius: 12 }}>
            {JSON.stringify(mockMember, null, 2)}
          </pre>
        )}
      </div>

      <div className="section-grid">
        <div className="card">
          <h3>Flow</h3>
          <ol>
            <li>LINE OA Rich Menu → LIFF ID → URL /liff</li>
            <li>โหลด SDK, init ด้วย liffId</li>
            <li>เรียก getProfile แล้วส่งเข้า /api/auth/line</li>
            <li>redirect ไปหน้า booking หลัก เช่น /branches</li>
          </ol>
        </div>
        <div className="card">
          <h3>ข้อควรทำ</h3>
          <ul>
            <li>เพิ่ม state management / session จริง (ไม่ใช้ mock)</li>
            <li>บันทึก token / cookie อย่างปลอดภัย</li>
            <li>จัดการกรณีปิด LIFF หรือยกเลิก permission</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
