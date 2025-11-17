import Link from 'next/link';

const heroPoints = [
  'แสดงจำนวนสิทธิ์และแพ็กเกจที่ยังเหลือให้สมาชิกเห็นทันที',
  'ซิงก์ตารางเรียนจากทุกสาขาผ่านฐานข้อมูล Prisma + PostgreSQL',
  'จอง จ่าย และยืนยันผ่าน LINE OA, LIFF และ Omise ภายใน flow เดียว',
];

const journeySteps = [
  {
    title: 'เริ่มจาก Rich Menu',
    description: 'ลูกค้าแตะ Rich Menu แล้วเข้าสู่ LIFF (/liff) ด้วย URL จริงที่ deploy ไว้.',
  },
  {
    title: 'ล็อกอินด้วย LINE',
    description: 'เมื่อเข้าสู่ LIFF ระบบเรียก /api/auth/line เพื่อสร้าง session ของสมาชิก.',
  },
  {
    title: 'เลือกสาขาและคลาส',
    description: 'สำรวจ /branches และ /classes เพื่อเลือกคลาสที่ยังมีที่ว่างพร้อมรายละเอียดครู.',
  },
  {
    title: 'ซื้อหรือใช้แพ็กเกจ',
    description: 'สมาชิกดูสิทธิ์คงเหลือที่ /packages และชำระเงินผ่าน Omise webhook.',
  },
];

const actionCards = [
  {
    title: 'ดูตารางคลาส',
    description: 'สำรวจคลาสตามวันที่และสาขา พร้อมแสดงจำนวนที่นั่งว่างแบบเรียลไทม์.',
    href: '/classes',
    cta: 'เข้าสู่ตารางเรียน',
  },
  {
    title: 'เลือกสาขาโปรด',
    description: 'โชว์รายละเอียดแต่ละสาขา เวลาทำการ และคลาสเด่นที่เปิดรับสมัคร.',
    href: '/branches',
    cta: 'สำรวจสาขา',
  },
  {
    title: 'แพ็กเกจสำหรับคุณ',
    description: 'แพ็กเกจ 5/10 ครั้ง หรือแบบรายเดือนเพื่อรองรับลูกค้าทุกกลุ่ม.',
    href: '/packages',
    cta: 'ดูแพ็กเกจ',
  },
];

const supportHighlights = [
  {
    title: 'Omise พร้อมเชื่อมต่อ',
    description: 'endpoint /api/packages/:id/purchase และ /api/omise/webhook รองรับการตรวจ signature.',
  },
  {
    title: 'แดชบอร์ดสตูดิโอ',
    description: 'หน้า /dashboard-87xDz6t ใช้จัดการสาขา คอร์ส ตารางเรียน และข้อมูลแอดมิน.',
  },
  {
    title: 'ต่อยอด Production ได้ทันที',
    description: 'เพิ่ม session จริง, image upload, และ role-based access ตามที่ README.md แนะนำ.',
  },
];

export default function HomePage() {
  return (
    <div className="onpage">
      <section className="yoga-hero">
        <div className="yoga-hero__content">
          <p className="tag tag--blush">Yoga LIFF Experience</p>
          <h1>หน้าหลักที่ยก flow จาก LIFF มาไว้ให้ครบ</h1>
          <p>
            ออกแบบเพื่อเป็นหน้ารวมข้อมูลที่อัปเดตจาก{' '}
            <a href="https://34a8b8ec5a2f.ngrok-free.app/liff" target="_blank" rel="noreferrer" className="floating-link">
              https://34a8b8ec5a2f.ngrok-free.app/liff
            </a>{' '}
            ช่วยให้ทีมโยคะสื่อสารประสบการณ์จริงก่อนลูกค้าเข้าสู่ LIFF.
          </p>
          <div className="cta-row">
            <a
              href="https://34a8b8ec5a2f.ngrok-free.app/liff"
              className="primary-btn"
              target="_blank"
              rel="noreferrer"
            >
              เปิด LIFF ที่ใช้งานจริง
            </a>
            <Link href="/liff" className="ghost-btn">
              ทดลอง flow จำลอง
            </Link>
          </div>
          <ul className="hero-points">
            {heroPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="hero-visual card">
          <p className="muted-text">สรุปรายงานประจำวัน</p>
          <div className="stat-grid">
            <div className="stat-card">
              <strong>128</strong>
              <span>การจองวันนี้</span>
            </div>
            <div className="stat-card">
              <strong>42</strong>
              <span>ลูกค้าจ่ายผ่าน Omise</span>
            </div>
            <div className="stat-card">
              <strong>5</strong>
              <span>สตูดิโอที่เชื่อมต่อ</span>
            </div>
            <div className="stat-card">
              <strong>92%</strong>
              <span>อัตราเข้าร่วม</span>
            </div>
          </div>
          <p className="muted-text">ข้อมูล mock เพื่อสื่อสาร layout และ responsive grid</p>
        </div>
      </section>

      <section>
        <h2 className="section-heading">Journey ใน LIFF ที่สะท้อนบนหน้าแรก</h2>
        <div className="journey-grid">
          {journeySteps.map((step) => (
            <article key={step.title} className="journey-step">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-heading">เริ่มต้นใช้งานจากเมนูหลัก</h2>
        <div className="chakra-grid">
          {actionCards.map((card) => (
            <article key={card.title} className="chakra-card">
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <Link href={card.href} className="link-button">
                {card.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-heading">การสนับสนุนจากทีมสตูดิโอ</h2>
        <div className="support-grid">
          {supportHighlights.map((item) => (
            <article key={item.title} className="support-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
