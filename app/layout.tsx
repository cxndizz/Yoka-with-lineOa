import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getMockSessionMember } from '@/lib/mock-auth';

export const metadata = {
  title: 'Yoga Flow LIFF Studio',
  description: 'Holistic yoga booking journey via LINE OA, LIFF & Omise',
};

const navigation = [
  { href: '/', label: 'Yoga LIFF' },
  { href: '/liff', label: 'Rich Menu Entry' },
  { href: '/branches', label: 'Branches' },
  { href: '/classes', label: 'Classes' },
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
              <p className="eyebrow">Yoka Flow Collective</p>
              <Link href="/" className="logo">
                Yoga Booking Hub
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
            {member && (
              <div className="user-pill">
                {member.linePictureUrl ? (
                  <img src={member.linePictureUrl} alt={member.lineDisplayName ?? 'Member avatar'} />
                ) : (
                  <div className="avatar-fallback">{member.lineDisplayName?.charAt(0) ?? 'M'}</div>
                )}
                <div>
                  <p>{member.lineDisplayName || 'LINE Member'}</p>
                  <span>{member.email || 'line user • mock session'}</span>
                </div>
              </div>
            )}
          </header>
          <main className="page-container">{children}</main>
          <footer className="site-footer">
            <p>ระบบจองโยคะหลายสาขา เชื่อม LINE OA, LIFF และ Omise เพื่อประสบการณ์ไร้รอยต่อ.</p>
            <p>© {new Date().getFullYear()} Yoka Flow Studio</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
