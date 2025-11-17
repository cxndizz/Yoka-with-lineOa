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
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'prompt-login'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [liffApp, setLiffApp] = useState<any | null>(null);

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
        setLiffApp(liff);
        if (!liff.isLoggedIn()) {
          setStatus('prompt-login');
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

  async function handleLogin() {
    if (!liffApp) {
      setError('ยังไม่พบ LIFF SDK บนหน้านี้');
      return;
    }
    setStatus('loading');
    liffApp.login({});
  }

  function handleContinue() {
    window.location.href = '/branches';
  }

  return (
    <section className="liff-section">
      <div className="liff-hero">
        <div>
          <p className="liff-hero__eyebrow">Yoga On-The-Go</p>
          <h1>เริ่มจองคลาสโยคะผ่าน LINE</h1>
          <p>
            เปิดเมนูนี้จาก Rich Menu เพื่อเข้าสู่พื้นที่ลูกค้าของ Yoga Club และจองคอร์สในสาขาโปรดได้ทันที
            เพียงล็อกอินด้วยบัญชี LINE ของคุณ
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
              ดูแพ็กเกจสุดคุ้ม
            </a>
          </div>
        </div>
        <div className="liff-hero__card">
          <p>สถานะบัญชี</p>
          <strong>
            {status === 'ready' && profile
              ? 'พร้อมใช้งาน'
              : status === 'prompt-login'
                ? 'ต้องการล็อกอิน'
                : status === 'loading'
                  ? 'กำลังตรวจสอบ'
                  : error
                    ? 'เกิดข้อผิดพลาด'
                    : 'กำลังเตรียมระบบ'}
          </strong>
          {profile && (
            <div className="liff-profile">
              {profile.pictureUrl ? (
                <img src={profile.pictureUrl} alt={profile.displayName} />
              ) : (
                <div className="liff-profile__fallback">{profile.displayName?.charAt(0) || 'U'}</div>
              )}
              <div>
                <p>{profile.displayName}</p>
                <span>{profile.userId}</span>
              </div>
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          {status === 'prompt-login' && (
            <p className="muted-text">แตะปุ่ม “ล็อกอินผ่าน LINE” เพื่อยืนยันตัวตนก่อนใช้งาน</p>
          )}
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
