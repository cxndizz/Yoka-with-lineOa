import { prisma } from '@/lib/prisma';

interface PackagesPageProps {
  searchParams?: { branch?: string };
}

async function getPackages(branchId?: string) {
  const where: any = { isActive: true };
  if (branchId) {
    where.OR = [{ scope: 'global' }, { scope: 'branch_only', branchId }];
  }
  return prisma.package.findMany({
    where,
    include: { branch: true },
    orderBy: { price: 'asc' },
  });
}

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const branchParam = searchParams?.branch;
  const [packages, branches] = await Promise.all([
    getPackages(branchParam),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <section>
      <div className="hero">
        <div>
          <p className="tag">แพ็กเกจ & Payment</p>
          <h1>แพ็กเกจสำหรับสมาชิก</h1>
          <p>
            เมื่อกดซื้อแพ็กเกจ ระบบจะเรียก <code>/api/packages/:id/purchase</code> เพื่อสร้าง charge ใน Omise
            และคอยรับ webhook เพื่ออัปเดต MemberPackage ตาม README.md.
          </p>
        </div>
      </div>

      <form method="get" style={{ marginTop: 24 }} className="section-grid">
        <label>
          จำกัดตามสาขา
          <select name="branch" defaultValue={branchParam || ''}>
            <option value="">ทุกสาขา</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="primary-btn">
            อัปเดต
          </button>
        </div>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>ชื่อแพ็กเกจ</th>
            <th>ประเภท</th>
            <th>ราคา</th>
            <th>สิทธิ์ที่ได้รับ</th>
            <th>Scope</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>{pkg.name}</td>
              <td>{pkg.packageType}</td>
              <td>
                {Number(pkg.price).toLocaleString('th-TH', { style: 'currency', currency: pkg.currency })}
              </td>
              <td>
                {pkg.packageType === 'sessions'
                  ? `${pkg.totalSessions || 0} ครั้ง`
                  : `${pkg.durationDays || 0} วัน`}
              </td>
              <td>{pkg.scope === 'global' ? 'ใช้ได้ทุกสาขา' : pkg.branch?.name || 'สาขาเฉพาะ'}</td>
              <td>
                <a className="primary-btn" href={`/api/packages/${pkg.id}/purchase`}>
                  ทดลอง purchase
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
