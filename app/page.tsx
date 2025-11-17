import Link from 'next/link';

const features = [
  'Next.js 14 App Router พร้อม TypeScript',
  'Prisma + PostgreSQL สำหรับจัดการสาขา คอร์ส แพ็กเกจ และตารางเรียน',
  'เชื่อมต่อ LINE OA ผ่าน LIFF / LINE Login และเรียกใช้ Omise Node SDK ได้ทันที',
  'API พื้นฐาน: auth/line, me, branches, classes, bookings, packages, purchases, omise/webhook',
];

const checklist = [
  'ตั้งค่า environment (.env) ตาม README.md',
  'Prisma migrate + เติมข้อมูลผ่าน Studio หรือ API',
  'เชื่อม LIFF URL → /liff แล้วส่งโปรไฟล์ไป /api/auth/line',
  'ทดสอบ flow จองคลาส / ซื้อแพ็กเกจ / ยกเลิก / รับ webhook',
  'หากต้องการบริหารข้อมูล ให้รัน dev:admin (port 4001) เพื่อใช้ Admin Portal แยกจากลูกค้า',
];

export default function HomePage() {
  return (
    <div className="hero">
      <div>
        <p className="tag">พร้อมต่อยอดสู่ Production</p>
        <h1>ระบบจองคอร์สโยคะหลายสาขา ผ่าน LINE OA + Omise</h1>
        <p>
          โครงสร้างพร้อมใช้สำหรับทีมสตูดิโอโยคะที่ต้องการให้ลูกค้าจองคลาสผ่าน Rich-Menu,
          รู้สิทธิ์คงเหลือจากแพ็กเกจ และจ่ายเงินผ่าน Omise ได้แบบไร้รอยต่อ ทั้งหมดต่อยอดจาก
          README.md ที่ให้ขั้นตอนครบถ้วน.
        </p>
        <div className="cta-row">
          <Link href="/branches" className="primary-btn">
            เปิดตารางคลาส &rarr;
          </Link>
          <Link href="/liff" className="ghost-btn">
            ทดสอบ LIFF entry
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>ฟีเจอร์หลัก</h3>
        <ul>
          {features.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="section-heading">Checklist ก่อนขึ้นจริง</h2>
        <ol>
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <div className="section-grid">
        <div className="card">
          <h3>Flow สมาชิก</h3>
          <p>
            ลูกค้าเปิด Rich Menu → LIFF (/liff) → ล็อกอิน LINE → /branches เพื่อเลือกสาขา
            → /classes สำหรับเลือกคลาส → /packages เมื่อต้องซื้อสิทธิ์เพิ่ม.
          </p>
        </div>
        <div className="card">
          <h3>Admin Portal (แยกพอร์ต)</h3>
          <p>
            รันคำสั่ง <code>npm run dev:admin</code> เพื่อเปิดระบบหลังบ้านบนพอร์ต 4001 ซึ่งรวมหน้า
            Dashboard ไว้ที่ <code>/admin</code> โดยไม่ปะปนกับอินเทอร์เฟซลูกค้า.
          </p>
        </div>
        <div className="card">
          <h3>Omise + Webhook</h3>
          <p>
            API <code>/api/packages/:id/purchase</code> และ <code>/api/omise/webhook</code>{' '}
            พร้อมสำหรับเชื่อม Omise Dashboard – อย่าลืมตรวจ signature ก่อนอัปเดตสถานะ.
          </p>
        </div>
        <div className="card">
          <h3>Auth Strategy</h3>
          <p>
            ปัจจุบันใช้ mock member (record แรกใน DB) เพื่อให้ UI ทำงานได้ครบทุกหน้า พร้อมบอกตำแหน่ง
            ที่ต้องต่อ session / JWT จริงใน README.md.
          </p>
        </div>
      </div>
    </div>
  );
}
