import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL || 'admin@yogaclub.com';
const adminLineUserId = process.env.ADMIN_LINE_USER_ID || 'admin-line-user';

async function seedAdmin() {
  const admin = await prisma.member.upsert({
    where: { lineUserId: adminLineUserId },
    update: {
      email: adminEmail,
      lineDisplayName: 'Yoga Club Admin',
      isAdmin: true,
    },
    create: {
      lineUserId: adminLineUserId,
      email: adminEmail,
      lineDisplayName: 'Yoga Club Admin',
      isAdmin: true,
    },
  });
  return admin;
}

async function seedBranches() {
  const branches = [
    {
      slug: 'central-world',
      name: 'Central World Studio',
      address: 'ชั้น 4 Central World, แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ',
      phone: '02-123-4567',
      locationInfo: 'จอดรถที่โซน B ก่อนขึ้นลิฟต์ฝั่ง ZEN',
    },
    {
      slug: 'sukhumvit-24',
      name: 'Sukhumvit 24 Loft',
      address: '23/2 ถนนสุขุมวิท 24 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ',
      phone: '02-987-6543',
      locationInfo: 'ใกล้ BTS พร้อมพงษ์ ออกประตู 4',
    },
  ];

  const results = [];
  for (const data of branches) {
    const branch = await prisma.branch.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        locationInfo: data.locationInfo,
        isActive: true,
      },
      create: {
        slug: data.slug,
        name: data.name,
        address: data.address,
        phone: data.phone,
        locationInfo: data.locationInfo,
        isActive: true,
      },
    });
    results.push(branch);
  }
  return results;
}

async function seedCourses() {
  const courses = [
    {
      id: 'seed-course-hatha-flow',
      name: 'Morning Hatha Flow',
      description: 'ปรับสมดุลร่างกายด้วย Hatha Flow เหมาะกับทุกระดับ',
      level: 'All Levels',
      durationMin: 60,
    },
    {
      id: 'seed-course-power-vinyasa',
      name: 'Power Vinyasa',
      description: 'คอร์สเข้มข้นสำหรับผู้ที่ต้องการความท้าทายและเผาผลาญ',
      level: 'Intermediate',
      durationMin: 75,
    },
  ];

  const results = [];
  for (const data of courses) {
    const course = await prisma.course.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        description: data.description,
        level: data.level,
        durationMin: data.durationMin,
        isActive: true,
      },
      create: {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        durationMin: data.durationMin,
        isActive: true,
      },
    });
    results.push(course);
  }
  return results;
}

async function main() {
  const [admin, branches, courses] = await Promise.all([
    seedAdmin(),
    seedBranches(),
    seedCourses(),
  ]);

  console.log(`Seeded admin ${admin.email} พร้อม ${branches.length} สาขา และ ${courses.length} คอร์ส`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
