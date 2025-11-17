import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function getBranches() {
  const now = new Date();
  return prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      classSchedules: {
        where: { startAt: { gte: now } },
        include: {
          course: true,
          teacher: true,
        },
        orderBy: { startAt: 'asc' },
        take: 3,
      },
      rooms: true,
    },
  });
}

export default async function BranchesPage() {
  const branches = await getBranches();

  return (
    <section>
      <div className="hero">
        <div>
          <p className="tag">เลือกสาขาที่สะดวก</p>
          <h1>Branch overview</h1>
          <p>
            ดึงข้อมูลจากฐาน PostgreSQL ผ่าน Prisma ตามที่ README.md แนะนำ พร้อมโชว์ตารางเรียนถัดไป
            เพื่อให้ทีมหน้าร้านพาสมาชิกเข้าสู่ flow ได้ไว.
          </p>
        </div>
        <div className="card">
          <h3>Tips</h3>
          <ul>
            <li>เพิ่ม/ปิดสาขาได้ที่ /dashboard-87xDz6t → Create Branch</li>
            <li>เชื่อม Rich-menu ได้ทั้งตามสาขา หรือใช้ global URL</li>
            <li>กำหนด homeBranch ให้สมาชิก เพื่อ personalize</li>
          </ul>
        </div>
      </div>

      <div className="section-grid" style={{ marginTop: '48px' }}>
        {branches.map((branch) => (
          <div className="card" key={branch.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{branch.name}</h3>
              <span className="tag">{branch.slug}</span>
            </div>
            <p>{branch.address || 'ยังไม่ได้กรอกที่อยู่'}</p>
            {branch.phone && <p>โทร. {branch.phone}</p>}
            {branch.locationInfo && <p>แผนที่: {branch.locationInfo}</p>}
            <p>ห้องซ้อม {branch.rooms.length} ห้อง</p>

            <div>
              <strong>คลาสที่จะมาถึง</strong>
              {branch.classSchedules.length === 0 && <p>ยังไม่มีคลาสที่กำหนด</p>}
              {branch.classSchedules.map((schedule) => (
                <div key={schedule.id} className="schedule-card" style={{ marginTop: 12 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{schedule.course.name}</p>
                  <p style={{ margin: '4px 0' }}>
                    {new Date(schedule.startAt).toLocaleString('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p style={{ margin: 0 }}>
                    ครู {schedule.teacher?.name || 'ยังไม่ระบุ'} • {schedule.course.level || 'ทุกระดับ'}
                  </p>
                </div>
              ))}
            </div>
            <div className="cta-row" style={{ marginTop: 16 }}>
              <Link href={`/classes?branch=${branch.id}`} className="ghost-btn">
                ดูคลาสทั้งหมด
              </Link>
              <Link href={`/packages?branch=${branch.id}`} className="primary-btn">
                แพ็กเกจสำหรับสาขานี้
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
