import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Yoga Booking via LINE',
  description: 'Yoga class booking system integrated with LINE OA & Omise',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
