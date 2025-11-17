import { prisma } from '@/lib/prisma';

interface ClassPageProps {
  searchParams?: { date?: string; branch?: string };
}

async function getClasses(dateFilter?: string, branchId?: string) {
  const where: any = {};

  if (branchId) {
    where.branchId = branchId;
  }

  if (dateFilter) {
    const base = new Date(`${dateFilter}T00:00:00`);
    const end = new Date(base);
    end.setDate(end.getDate() + 1);
    where.startAt = { gte: base, lt: end };
  }

  return prisma.classSchedule.findMany({
    where,
    include: {
      branch: true,
      course: { include: { mainImage: true } },
      teacher: true,
      bookings: true,
    },
    orderBy: { startAt: 'asc' },
  });
}

export default async function ClassesPage({ searchParams }: ClassPageProps) {
  const dateParam = searchParams?.date;
  const branchParam = searchParams?.branch;
  const [classes, branches] = await Promise.all([
    getClasses(dateParam, branchParam),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  const selectedDate = dateParam || new Date().toISOString().slice(0, 10);

  return (
    <section>
      <div className="hero">
        <div>
          <p className="tag">ขั้นตอนการจอง</p>
          <h1>เลือกคลาสที่ต้องการ</h1>
          <p>
            ข้อมูลนี้ดึงมาจากตาราง ClassSchedule ซึ่งมาจาก admin / Prisma Studio ช่วยให้พนักงานและสมาชิก
            เห็นสถานะที่นั่ง, ครูผู้สอน และแพ็กเกจที่ต้องมี ก่อนส่งต่อไปยัง Omise payment.
          </p>
        </div>
      </div>

      <form method="get" className="section-grid" style={{ marginTop: 32 }}>
        <label>
          เลือกวัน
          <input type="date" name="date" defaultValue={selectedDate} />
        </label>
        <label>
          สาขา
          <select name="branch" defaultValue={branchParam || ''}>
            <option value="">ทุกสาขา</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" className="primary-btn">
            กรองข้อมูล
          </button>
        </div>
      </form>

      <div className="schedule-grid">
        {classes.length === 0 && <p>ยังไม่มีคลาสในเงื่อนไขนี้</p>}
        {classes.map((cls) => (
          <article key={cls.id} className="schedule-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{cls.course.name}</h3>
              <span className="status-pill">{cls.status}</span>
            </div>
            <p style={{ margin: '8px 0 4px' }}>
              {new Date(cls.startAt).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
            <p style={{ margin: '0 0 4px' }}>สาขา {cls.branch.name}</p>
            <p style={{ margin: '0 0 4px' }}>ครู {cls.teacher?.name || 'รอตั้งค่า'}</p>
            <p style={{ margin: '0 0 12px' }}>
              ที่นั่ง {cls.capacity || '∞'} / จองแล้ว {cls.bookings.length}
            </p>
            <div className="cta-row">
              <a className="ghost-btn" href={`mailto:frontdesk@yoga.app?subject=Book ${cls.course.name}`}>
                จองให้ลูกค้า
              </a>
              <a className="primary-btn" href={`/packages?branch=${cls.branchId}`}>
                ซื้อแพ็กเกจ
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
