import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getMockSessionMember } from '@/lib/mock-auth';

export const metadata = {
  title: 'Yoga Booking via LINE',
  description: 'Yoga class booking system integrated with LINE OA & Omise',
};

const navigation = [
  { href: '/', label: 'Overview' },
  { href: '/branches', label: 'Branches' },
  { href: '/classes', label: 'Class Schedule' },
  { href: '/packages', label: 'Packages' },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const member = await getMockSessionMember();

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div>
              <p className="eyebrow">Yoga Booking Starter</p>
              <Link href="/" className="logo">
                LINE OA + LIFF + Omise
              </Link>
            </div>
            <nav>
              <ul>
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="user-pill">
              {member ? (
                <>
                  {member.linePictureUrl ? (
                    <img src={member.linePictureUrl} alt={member.lineDisplayName ?? 'Member avatar'} />
                  ) : (
                    <div className="avatar-fallback">{member.lineDisplayName?.charAt(0) ?? 'M'}</div>
                  )}
                  <div>
                    <p>{member.lineDisplayName || 'LINE Member'}</p>
                    <span>{member.email || 'line user • mock session'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="avatar-fallback">?</div>
                  <div>
                    <p>ยังไม่ได้ล็อกอิน</p>
                    <span>เปิดผ่าน LIFF เพื่อเชื่อมบัญชี LINE</span>
                  </div>
                </>
              )}
            </div>
          </header>
          <main className="page-container">{children}</main>
          <footer className="site-footer">
            <p>
              อ้างอิง flow และ API จาก README.md เพื่อปรับสู่ระบบใช้งานจริง — พร้อมเชื่อมต่อ LINE OA,
              LIFF และ Omise.
            </p>
            <p>© {new Date().getFullYear()} Yoga Booking Starter</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
