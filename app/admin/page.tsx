import { prisma } from '@/lib/prisma';
import { AdminWorkspace } from '@/components/admin/AdminWorkspace';

export default async function AdminPage() {
  const [branches, courses, teachers, schedules] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: 'asc' } }),
    prisma.course.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.teacher.findMany({ orderBy: { name: 'asc' } }),
    prisma.classSchedule.findMany({
      include: {
        branch: true,
        course: true,
        teacher: true,
      },
      orderBy: { startAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <section>
      <div className="hero">
        <div>
          <p className="tag">Back-office</p>
          <h1>Admin control center</h1>
          <p>
            เชื่อมต่อ endpoint /api/admin/* เพื่อสร้างเนื้อหาใหม่จากอินเทอร์เฟซนี้ ก่อนต่อยอดด้วยการทำ RBAC
            และ session จริงตามคำแนะนำใน README.md.
          </p>
        </div>
      </div>

      <AdminWorkspace
        branches={branches}
        courses={courses}
        teachers={teachers}
        schedules={schedules}
      />
    </section>
  );
}
