import { prisma } from '@/lib/prisma';
import { AdminPortal } from '@/components/admin/AdminPortal';

export default async function AdminPage() {
  const [branches, courses, teachers, schedules, customers, payments, activePackageCount, revenueAgg, totalCustomers] =
    await Promise.all([
      prisma.branch.findMany({ orderBy: { name: 'asc' } }),
      prisma.course.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.teacher.findMany({ orderBy: { name: 'asc' } }),
      prisma.classSchedule.findMany({
        include: {
          branch: true,
          course: true,
          teacher: true,
        },
        orderBy: { startAt: 'asc' },
        take: 5,
      }),
      prisma.member.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.payment.findMany({
        include: { member: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.memberPackage.count({ where: { status: 'active' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'paid',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.member.count(),
    ]);

  const branchPayload = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    slug: branch.slug,
    address: branch.address,
    phone: branch.phone,
    locationInfo: branch.locationInfo,
    isActive: branch.isActive,
  }));

  const coursePayload = courses.map((course) => ({
    id: course.id,
    name: course.name,
    description: course.description,
    level: course.level,
    durationMin: course.durationMin,
    isActive: course.isActive,
  }));

  const teacherPayload = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    bio: teacher.bio,
    avatarUrl: teacher.avatarUrl,
  }));

  const customerPayload = customers.map((customer) => ({
    id: customer.id,
    lineDisplayName: customer.lineDisplayName,
    email: customer.email,
    phone: customer.phone,
    homeBranchId: customer.homeBranchId,
    isAdmin: customer.isAdmin,
  }));

  const paymentPayload = payments.map((payment) => ({
    id: payment.id,
    memberId: payment.memberId,
    amount: payment.amount.toNumber(),
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    createdAt: payment.createdAt.toISOString(),
    memberName: payment.member?.lineDisplayName ?? payment.member?.email ?? null,
  }));

  const schedulePayload = schedules.map((schedule) => ({
    id: schedule.id,
    startAt: schedule.startAt.toISOString(),
    branchName: schedule.branch.name,
    courseName: schedule.course.name,
    teacherName: schedule.teacher?.name ?? null,
  }));

  const stats = {
    totalBranches: branches.length,
    totalCourses: courses.length,
    totalCustomers,
    activePackages: activePackageCount,
    upcomingClasses: schedules.length,
    revenueThisMonth: revenueAgg._sum.amount?.toNumber() ?? 0,
  };

  return (
    <section>
      <div className="hero">
        <div>
          <p className="tag">Back-office</p>
          <h1>Yoga Admin Dashboard</h1>
          <p>ระบบจัดการสำหรับทีมงาน แยกจาก LIFF ลูกค้า มีทั้งแดชบอร์ด สร้าง/แก้ไขข้อมูล และตรวจสอบธุรกรรม</p>
        </div>
      </div>

      <AdminPortal
        branches={branchPayload}
        courses={coursePayload}
        teachers={teacherPayload}
        customers={customerPayload}
        payments={paymentPayload}
        schedules={schedulePayload}
        stats={stats}
      />
    </section>
  );
}
