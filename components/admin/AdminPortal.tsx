'use client';

import { useEffect, useRef, useState } from 'react';

type BranchPayload = {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  locationInfo?: string | null;
  isActive?: boolean;
};

type CoursePayload = {
  id: string;
  name: string;
  description?: string | null;
  level?: string | null;
  durationMin?: number | null;
  isActive?: boolean;
};

type TeacherPayload = {
  id: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

type CustomerPayload = {
  id: string;
  lineDisplayName?: string | null;
  email?: string | null;
  phone?: string | null;
  homeBranchId?: string | null;
  isAdmin?: boolean;
};

type PaymentPayload = {
  id: string;
  memberId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt?: string;
  memberName?: string | null;
};

type SchedulePreview = {
  id: string;
  startAt: string;
  branchName: string;
  courseName: string;
  teacherName?: string | null;
};

type DashboardStats = {
  totalBranches: number;
  totalCourses: number;
  totalCustomers: number;
  revenueThisMonth: number;
  upcomingClasses: number;
  activePackages: number;
};

type SessionSummary = {
  token: string;
  referenceId: string;
  displayName?: string | null;
  metadata?: Record<string, any>;
  lastSeenAt: string;
  expiresAt: string;
};

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface AdminPortalProps {
  branches: BranchPayload[];
  courses: CoursePayload[];
  teachers: TeacherPayload[];
  customers: CustomerPayload[];
  payments: PaymentPayload[];
  schedules: SchedulePreview[];
  stats: DashboardStats;
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'branches', label: 'สาขา' },
  { key: 'staff', label: 'Staff & Trainers' },
  { key: 'courses', label: 'คอร์ส' },
  { key: 'customers', label: 'ลูกค้า' },
  { key: 'payments', label: 'ประวัติการชำระเงิน' },
];

function normalizeAmount(value: any) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(num) ? 0 : num;
}

export function AdminPortal({ branches, courses, teachers, customers, payments, schedules, stats }: AdminPortalProps) {
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'checking' | 'ready'>('checking');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [branchList, setBranchList] = useState<BranchPayload[]>(branches);
  const [branchEdit, setBranchEdit] = useState<BranchPayload | null>(null);
  const [branchMessage, setBranchMessage] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);

  const [courseList, setCourseList] = useState<CoursePayload[]>(courses);
  const [courseEdit, setCourseEdit] = useState<CoursePayload | null>(null);
  const [courseMessage, setCourseMessage] = useState<string | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);

  const [teacherList, setTeacherList] = useState<TeacherPayload[]>(teachers);
  const [teacherEdit, setTeacherEdit] = useState<TeacherPayload | null>(null);
  const [teacherMessage, setTeacherMessage] = useState<string | null>(null);
  const [teacherError, setTeacherError] = useState<string | null>(null);

  const [customerList, setCustomerList] = useState<CustomerPayload[]>(customers);
  const [customerEdit, setCustomerEdit] = useState<CustomerPayload | null>(null);
  const [customerMessage, setCustomerMessage] = useState<string | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const [paymentList, setPaymentList] = useState<PaymentPayload[]>(payments);
  const [paymentEdit, setPaymentEdit] = useState<PaymentPayload | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/admin', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            setSession(null);
          }
          return;
        }
        const payload = await res.json();
        if (!cancelled) {
          setSession(payload.session);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setSessionStatus('ready');
        }
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session) {
      startRealtime(session.token);
      return;
    }
    socketRef.current?.close();
    if (typeof window !== 'undefined' && heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setConnectionState('disconnected');
  }, [session]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
      if (typeof window !== 'undefined' && heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');
    if (!email || !password) {
      setLoginError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error === 'invalid-credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : payload.error || 'ไม่สามารถเข้าสู่ระบบได้');
      }
      setSession(payload.session);
      setSessionStatus('ready');
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/admin', { method: 'DELETE' });
    setSession(null);
    setActiveView('dashboard');
  }

  async function request<T>(url: string, options: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error || 'ไม่สามารถบันทึกข้อมูลได้');
    }
    return res.json();
  }

  function startRealtime(token: string) {
    if (typeof window === 'undefined') return;
    if (socketRef.current) {
      socketRef.current.close();
    }
    setConnectionState('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/realtime/session?token=${token}&role=admin`);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnectionState('connected');
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'session:update') {
          setSession(payload.session);
        }
        if (payload?.type === 'session:expired') {
          setSession(null);
          setLoginError('เซสชันหมดอายุ โปรดเข้าสู่ระบบใหม่');
        }
      } catch {
        // ignore parse errors
      }
    });

    socket.addEventListener('close', () => {
      setConnectionState('disconnected');
    });

    if (heartbeatRef.current) {
      window.clearInterval(heartbeatRef.current);
    }
    heartbeatRef.current = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 10000);
  }

  async function handleBranchCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBranchError(null);
    setBranchMessage(null);
    const formData = new FormData(event.currentTarget);
    try {
      const payload = {
        name: formData.get('name'),
        slug: formData.get('slug'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        locationInfo: formData.get('locationInfo'),
      };
      const branch = await request<BranchPayload>('/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setBranchList((prev) => [branch, ...prev]);
      setBranchMessage('เพิ่มสาขาใหม่เรียบร้อย');
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      setBranchError(error.message);
    }
  }

  async function handleBranchUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!branchEdit) return;
    setBranchError(null);
    try {
      const updated = await request<BranchPayload>(`/api/admin/branches/${branchEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(branchEdit),
      });
      setBranchList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setBranchMessage('อัปเดตข้อมูลสาขาแล้ว');
      setBranchEdit(null);
    } catch (error: any) {
      setBranchError(error.message);
    }
  }

  async function handleBranchDelete(id: string) {
    if (!confirm('ยืนยันการลบสาขานี้หรือไม่?')) return;
    try {
      await request(`/api/admin/branches/${id}`, { method: 'DELETE' });
      setBranchList((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setBranchError(error.message);
    }
  }

  async function handleCourseCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCourseError(null);
    const formData = new FormData(event.currentTarget);
    try {
      const payload = {
        name: formData.get('name'),
        level: formData.get('level'),
        description: formData.get('description'),
        durationMin: formData.get('durationMin') ? Number(formData.get('durationMin')) : undefined,
      };
      const course = await request<CoursePayload>('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCourseList((prev) => [course, ...prev]);
      setCourseMessage('สร้างคอร์สใหม่เรียบร้อย');
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      setCourseError(error.message);
    }
  }

  async function handleCourseUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseEdit) return;
    try {
      const updated = await request<CoursePayload>(`/api/admin/courses/${courseEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(courseEdit),
      });
      setCourseList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setCourseMessage('บันทึกคอร์สแล้ว');
      setCourseEdit(null);
    } catch (error: any) {
      setCourseError(error.message);
    }
  }

  async function handleCourseDelete(id: string) {
    if (!confirm('ต้องการลบคอร์สนี้หรือไม่?')) return;
    try {
      await request(`/api/admin/courses/${id}`, { method: 'DELETE' });
      setCourseList((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setCourseError(error.message);
    }
  }

  async function handleTeacherCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeacherError(null);
    const formData = new FormData(event.currentTarget);
    try {
      const payload = {
        name: formData.get('name'),
        bio: formData.get('bio'),
        avatarUrl: formData.get('avatarUrl'),
      };
      const teacher = await request<TeacherPayload>('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTeacherList((prev) => [teacher, ...prev]);
      setTeacherMessage('เพิ่ม Staff ใหม่แล้ว');
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      setTeacherError(error.message);
    }
  }

  async function handleTeacherUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teacherEdit) return;
    try {
      const updated = await request<TeacherPayload>(`/api/admin/teachers/${teacherEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(teacherEdit),
      });
      setTeacherList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setTeacherMessage('อัปเดตข้อมูล Staff แล้ว');
      setTeacherEdit(null);
    } catch (error: any) {
      setTeacherError(error.message);
    }
  }

  async function handleTeacherDelete(id: string) {
    if (!confirm('ยืนยันการลบหรือไม่?')) return;
    try {
      await request(`/api/admin/teachers/${id}`, { method: 'DELETE' });
      setTeacherList((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setTeacherError(error.message);
    }
  }

  async function handleCustomerCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCustomerError(null);
    const formData = new FormData(event.currentTarget);
    try {
      const payload = {
        lineDisplayName: formData.get('lineDisplayName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        homeBranchId: formData.get('homeBranchId') || null,
      };
      const customer = await request<CustomerPayload>('/api/admin/members', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCustomerList((prev) => [customer, ...prev]);
      setCustomerMessage('เพิ่มลูกค้าเรียบร้อย');
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      setCustomerError(error.message);
    }
  }

  async function handleCustomerUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerEdit) return;
    try {
      const updated = await request<CustomerPayload>(`/api/admin/members/${customerEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(customerEdit),
      });
      setCustomerList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setCustomerMessage('บันทึกข้อมูลลูกค้าแล้ว');
      setCustomerEdit(null);
    } catch (error: any) {
      setCustomerError(error.message);
    }
  }

  async function handleCustomerDelete(id: string) {
    if (!confirm('ต้องการลบลูกค้ารายนี้หรือไม่?')) return;
    try {
      await request(`/api/admin/members/${id}`, { method: 'DELETE' });
      setCustomerList((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setCustomerError(error.message);
    }
  }

  async function handlePaymentCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentError(null);
    const formData = new FormData(event.currentTarget);
    try {
      const payload = {
        memberId: formData.get('memberId'),
        memberPackageId: formData.get('memberPackageId') || undefined,
        amount: formData.get('amount'),
        currency: formData.get('currency'),
        status: formData.get('status'),
        provider: formData.get('provider'),
      };
      const payment = await request<any>('/api/admin/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const formatted: PaymentPayload = {
        id: payment.id,
        memberId: payment.memberId,
        amount: normalizeAmount(payment.amount),
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        createdAt: payment.createdAt,
        memberName: payment.member?.lineDisplayName ?? payment.member?.email ?? payment.memberId,
      };
      setPaymentList((prev) => [formatted, ...prev]);
      setPaymentMessage('บันทึกการชำระเงินแล้ว');
      (event.currentTarget as HTMLFormElement).reset();
    } catch (error: any) {
      setPaymentError(error.message);
    }
  }

  async function handlePaymentUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentEdit) return;
    try {
      const updated = await request<any>(`/api/admin/payments/${paymentEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentEdit),
      });
      const formatted: PaymentPayload = {
        id: updated.id,
        memberId: updated.memberId,
        amount: normalizeAmount(updated.amount),
        currency: updated.currency,
        status: updated.status,
        provider: updated.provider,
        createdAt: updated.createdAt,
        memberName: updated.member?.lineDisplayName ?? updated.member?.email ?? updated.memberId,
      };
      setPaymentList((prev) => prev.map((item) => (item.id === formatted.id ? formatted : item)));
      setPaymentMessage('อัปเดตประวัติการจ่ายเงินแล้ว');
      setPaymentEdit(null);
    } catch (error: any) {
      setPaymentError(error.message);
    }
  }

  async function handlePaymentDelete(id: string) {
    if (!confirm('ลบประวัติการจ่ายเงินนี้หรือไม่?')) return;
    try {
      await request(`/api/admin/payments/${id}`, { method: 'DELETE' });
      setPaymentList((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setPaymentError(error.message);
    }
  }

  const connectionLabel =
    connectionState === 'connected'
      ? 'Real-time พร้อม'
      : connectionState === 'connecting'
        ? 'กำลังเชื่อมต่อ Real-time'
        : 'ยังไม่เชื่อมต่อ Real-time';

  if (sessionStatus === 'checking') {
    return (
      <div className="admin-login-card loading-state">
        <p className="tag">Back-office</p>
        <h1>กำลังตรวจสอบเซสชัน</h1>
        <p>ระบบกำลังตรวจสอบเซสชันเดิมและสร้างการเชื่อมต่อแบบ Real-time</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="admin-login-card">
        <p className="tag">Admin Portal</p>
        <h1>ลงชื่อเข้าใช้เพื่อจัดการระบบ</h1>
        <p>แดชบอร์ดนี้เชื่อมต่อด้วย WebSocket เพื่อป้องกันเซสชันหลุดเมื่อเปลี่ยนแท็บ</p>
        <form onSubmit={handleLogin}>
          <label>
            อีเมล
            <input name="email" type="email" placeholder="admin@yogaclub.com" required />
          </label>
          <label>
            รหัสผ่าน
            <input name="password" type="password" placeholder="••••••" required />
          </label>
          <button type="submit" className="primary-btn" disabled={loginLoading}>
            {loginLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบหลังบ้าน'}
          </button>
          {loginError && <p className="error-text">{loginError}</p>}
        </form>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <div className="admin-panel">
        <p className="tag">ภาพรวม</p>
        <h2 className="admin-section-title">Dashboard</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <p>สาขา</p>
            <strong>{stats.totalBranches}</strong>
          </div>
          <div className="admin-stat-card">
            <p>คอร์สที่เปิดขาย</p>
            <strong>{stats.totalCourses}</strong>
          </div>
          <div className="admin-stat-card">
            <p>ลูกค้า</p>
            <strong>{stats.totalCustomers}</strong>
          </div>
          <div className="admin-stat-card">
            <p>รายรับเดือนนี้ (บาท)</p>
            <strong>{stats.revenueThisMonth.toLocaleString('th-TH')}</strong>
          </div>
          <div className="admin-stat-card">
            <p>แพ็กเกจที่ยังใช้งาน</p>
            <strong>{stats.activePackages}</strong>
          </div>
          <div className="admin-stat-card">
            <p>คลาสที่กำลังจะถึง</p>
            <strong>{stats.upcomingClasses}</strong>
          </div>
        </div>
        <div className="stacked-card">
          <h3>ตาราง 5 คลาสถัดไป</h3>
          <table className="management-table">
            <thead>
              <tr>
                <th>วันเวลา</th>
                <th>คอร์ส</th>
                <th>สาขา</th>
                <th>ผู้สอน</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{new Date(schedule.startAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td>{schedule.courseName}</td>
                  <td>{schedule.branchName}</td>
                  <td>{schedule.teacherName || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderBranchPanel() {
    return (
      <div className="admin-panel">
        <p className="tag">Branch</p>
        <h2 className="admin-section-title">จัดการสาขา</h2>
        <form className="admin-form-grid" onSubmit={handleBranchCreate}>
          <label>
            ชื่อสาขา
            <input name="name" placeholder="Siam Square" required />
          </label>
          <label>
            Slug
            <input name="slug" placeholder="siam-square" required />
          </label>
          <label>
            เบอร์ติดต่อ
            <input name="phone" placeholder="02-000-0000" />
          </label>
          <label>
            ที่อยู่
            <input name="address" placeholder="รายละเอียดสาขา" />
          </label>
          <label>
            ข้อมูลเส้นทาง
            <input name="locationInfo" placeholder="ลิงก์แผนที่" />
          </label>
          <button type="submit" className="primary-btn">
            เพิ่มสาขา
          </button>
        </form>
        {branchMessage && <p className="success-text">{branchMessage}</p>}
        {branchError && <p className="error-text">{branchError}</p>}

        <table className="management-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>เบอร์</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {branchList.map((branch) => (
              <tr key={branch.id}>
                <td>{branch.name}</td>
                <td>{branch.phone || '-'}</td>
                <td>{branch.isActive ? 'เปิด' : 'ปิด'}</td>
                <td className="entity-actions">
                  <button type="button" onClick={() => setBranchEdit(branch)}>
                    แก้ไข
                  </button>
                  <button type="button" className="delete" onClick={() => handleBranchDelete(branch.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {branchEdit && (
          <form className="admin-form-grid" onSubmit={handleBranchUpdate} style={{ marginTop: 24 }}>
            <h3 style={{ gridColumn: '1 / -1' }}>แก้ไขสาขา {branchEdit.name}</h3>
            <label>
              ชื่อสาขา
              <input
                value={branchEdit.name}
                onChange={(event) => setBranchEdit({ ...branchEdit, name: event.target.value })}
              />
            </label>
            <label>
              Slug
              <input
                value={branchEdit.slug}
                onChange={(event) => setBranchEdit({ ...branchEdit, slug: event.target.value })}
              />
            </label>
            <label>
              เบอร์ติดต่อ
              <input
                value={branchEdit.phone || ''}
                onChange={(event) => setBranchEdit({ ...branchEdit, phone: event.target.value })}
              />
            </label>
            <label>
              ที่อยู่
              <input
                value={branchEdit.address || ''}
                onChange={(event) => setBranchEdit({ ...branchEdit, address: event.target.value })}
              />
            </label>
            <label>
              ข้อมูลเส้นทาง
              <input
                value={branchEdit.locationInfo || ''}
                onChange={(event) => setBranchEdit({ ...branchEdit, locationInfo: event.target.value })}
              />
            </label>
            <label>
              เปิดใช้งาน
              <select
                value={branchEdit.isActive ? 'true' : 'false'}
                onChange={(event) => setBranchEdit({ ...branchEdit, isActive: event.target.value === 'true' })}
              >
                <option value="true">เปิด</option>
                <option value="false">ปิด</option>
              </select>
            </label>
            <button type="submit" className="primary-btn">
              บันทึกสาขา
            </button>
            <button type="button" className="ghost-btn" onClick={() => setBranchEdit(null)}>
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    );
  }

  function renderStaffPanel() {
    return (
      <div className="admin-panel">
        <p className="tag">Staff</p>
        <h2 className="admin-section-title">จัดการเทรนเนอร์ / Admin</h2>
        <form className="admin-form-grid" onSubmit={handleTeacherCreate}>
          <label>
            ชื่อ-นามสกุล
            <input name="name" placeholder="ครูเกด" required />
          </label>
          <label>
            ประวัติย่อ
            <input name="bio" placeholder="Certified Yoga" />
          </label>
          <label>
            รูปโปรไฟล์ (URL)
            <input name="avatarUrl" placeholder="https://" />
          </label>
          <button type="submit" className="primary-btn">
            เพิ่ม Staff
          </button>
        </form>
        {teacherMessage && <p className="success-text">{teacherMessage}</p>}
        {teacherError && <p className="error-text">{teacherError}</p>}

        <table className="management-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>Bio</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {teacherList.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.name}</td>
                <td>{teacher.bio || '-'}</td>
                <td className="entity-actions">
                  <button type="button" onClick={() => setTeacherEdit(teacher)}>
                    แก้ไข
                  </button>
                  <button type="button" className="delete" onClick={() => handleTeacherDelete(teacher.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {teacherEdit && (
          <form className="admin-form-grid" onSubmit={handleTeacherUpdate} style={{ marginTop: 24 }}>
            <h3 style={{ gridColumn: '1 / -1' }}>แก้ไขข้อมูล {teacherEdit.name}</h3>
            <label>
              ชื่อ
              <input
                value={teacherEdit.name}
                onChange={(event) => setTeacherEdit({ ...teacherEdit, name: event.target.value })}
              />
            </label>
            <label>
              Bio
              <input
                value={teacherEdit.bio || ''}
                onChange={(event) => setTeacherEdit({ ...teacherEdit, bio: event.target.value })}
              />
            </label>
            <label>
              Avatar URL
              <input
                value={teacherEdit.avatarUrl || ''}
                onChange={(event) => setTeacherEdit({ ...teacherEdit, avatarUrl: event.target.value })}
              />
            </label>
            <button type="submit" className="primary-btn">
              บันทึก Staff
            </button>
            <button type="button" className="ghost-btn" onClick={() => setTeacherEdit(null)}>
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    );
  }

  function renderCoursePanel() {
    return (
      <div className="admin-panel">
        <p className="tag">Courses</p>
        <h2 className="admin-section-title">จัดการคอร์ส</h2>
        <form className="admin-form-grid" onSubmit={handleCourseCreate}>
          <label>
            ชื่อคอร์ส
            <input name="name" placeholder="Yin Detox" required />
          </label>
          <label>
            Level
            <input name="level" placeholder="All Level" />
          </label>
          <label>
            ระยะเวลา (นาที)
            <input name="durationMin" type="number" placeholder="60" />
          </label>
          <label>
            คำอธิบาย
            <input name="description" placeholder="รายละเอียดคลาส" />
          </label>
          <button type="submit" className="primary-btn">
            เพิ่มคอร์ส
          </button>
        </form>
        {courseMessage && <p className="success-text">{courseMessage}</p>}
        {courseError && <p className="error-text">{courseError}</p>}

        <table className="management-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>Level</th>
              <th>Duration</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {courseList.map((course) => (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.level || '-'}</td>
                <td>{course.durationMin ? `${course.durationMin} นาที` : '-'}</td>
                <td>{course.isActive === false ? 'ปิด' : 'เปิด'}</td>
                <td className="entity-actions">
                  <button type="button" onClick={() => setCourseEdit(course)}>
                    แก้ไข
                  </button>
                  <button type="button" className="delete" onClick={() => handleCourseDelete(course.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {courseEdit && (
          <form className="admin-form-grid" onSubmit={handleCourseUpdate} style={{ marginTop: 24 }}>
            <h3 style={{ gridColumn: '1 / -1' }}>แก้ไขคอร์ส {courseEdit.name}</h3>
            <label>
              ชื่อคอร์ส
              <input
                value={courseEdit.name}
                onChange={(event) => setCourseEdit({ ...courseEdit, name: event.target.value })}
              />
            </label>
            <label>
              Level
              <input
                value={courseEdit.level || ''}
                onChange={(event) => setCourseEdit({ ...courseEdit, level: event.target.value })}
              />
            </label>
            <label>
              ระยะเวลา
              <input
                type="number"
                value={courseEdit.durationMin || ''}
                onChange={(event) =>
                  setCourseEdit({ ...courseEdit, durationMin: Number(event.target.value) || undefined })
                }
              />
            </label>
            <label>
              คำอธิบาย
              <input
                value={courseEdit.description || ''}
                onChange={(event) => setCourseEdit({ ...courseEdit, description: event.target.value })}
              />
            </label>
            <label>
              เปิดใช้งาน
              <select
                value={courseEdit.isActive === false ? 'false' : 'true'}
                onChange={(event) => setCourseEdit({ ...courseEdit, isActive: event.target.value === 'true' })}
              >
                <option value="true">เปิด</option>
                <option value="false">ปิด</option>
              </select>
            </label>
            <button type="submit" className="primary-btn">
              บันทึกคอร์ส
            </button>
            <button type="button" className="ghost-btn" onClick={() => setCourseEdit(null)}>
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    );
  }

  function renderCustomerPanel() {
    return (
      <div className="admin-panel">
        <p className="tag">Customers</p>
        <h2 className="admin-section-title">ลูกค้าทั้งหมด</h2>
        <form className="admin-form-grid" onSubmit={handleCustomerCreate}>
          <label>
            ชื่อลูกค้า
            <input name="lineDisplayName" placeholder="คุณอิ้ง" required />
          </label>
          <label>
            อีเมล
            <input name="email" type="email" placeholder="you@example.com" />
          </label>
          <label>
            เบอร์โทร
            <input name="phone" placeholder="080-000-0000" />
          </label>
          <label>
            สาขาที่ดูแล
            <select name="homeBranchId" defaultValue="">
              <option value="">ยังไม่ระบุ</option>
              {branchList.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="primary-btn">
            เพิ่มลูกค้า
          </button>
        </form>
        {customerMessage && <p className="success-text">{customerMessage}</p>}
        {customerError && <p className="error-text">{customerError}</p>}

        <table className="management-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>เบอร์</th>
              <th>อีเมล</th>
              <th>สาขา</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {customerList.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.lineDisplayName || '-'}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.email || '-'}</td>
                <td>
                  {branchList.find((branch) => branch.id === customer.homeBranchId)?.name || '—'}
                </td>
                <td className="entity-actions">
                  <button type="button" onClick={() => setCustomerEdit(customer)}>
                    แก้ไข
                  </button>
                  <button type="button" className="delete" onClick={() => handleCustomerDelete(customer.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customerEdit && (
          <form className="admin-form-grid" onSubmit={handleCustomerUpdate} style={{ marginTop: 24 }}>
            <h3 style={{ gridColumn: '1 / -1' }}>แก้ไขลูกค้า</h3>
            <label>
              ชื่อ
              <input
                value={customerEdit.lineDisplayName || ''}
                onChange={(event) =>
                  setCustomerEdit({ ...customerEdit, lineDisplayName: event.target.value })
                }
              />
            </label>
            <label>
              อีเมล
              <input
                type="email"
                value={customerEdit.email || ''}
                onChange={(event) => setCustomerEdit({ ...customerEdit, email: event.target.value })}
              />
            </label>
            <label>
              เบอร์โทร
              <input
                value={customerEdit.phone || ''}
                onChange={(event) => setCustomerEdit({ ...customerEdit, phone: event.target.value })}
              />
            </label>
            <label>
              สาขาที่ดูแล
              <select
                value={customerEdit.homeBranchId || ''}
                onChange={(event) => setCustomerEdit({ ...customerEdit, homeBranchId: event.target.value || null })}
              >
                <option value="">ยังไม่ระบุ</option>
                {branchList.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              สิทธิ์ผู้ดูแล
              <select
                value={customerEdit.isAdmin ? 'true' : 'false'}
                onChange={(event) => setCustomerEdit({ ...customerEdit, isAdmin: event.target.value === 'true' })}
              >
                <option value="false">ลูกค้าทั่วไป</option>
                <option value="true">Admin</option>
              </select>
            </label>
            <button type="submit" className="primary-btn">
              บันทึกลูกค้า
            </button>
            <button type="button" className="ghost-btn" onClick={() => setCustomerEdit(null)}>
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    );
  }

  function renderPaymentPanel() {
    return (
      <div className="admin-panel">
        <p className="tag">Payments</p>
        <h2 className="admin-section-title">ประวัติการชำระเงิน</h2>
        <form className="admin-form-grid" onSubmit={handlePaymentCreate}>
          <label>
            ลูกค้า
            <select name="memberId" required defaultValue="">
              <option value="" disabled>
                เลือกลูกค้า
              </option>
              {customerList.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.lineDisplayName || customer.email || customer.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            จำนวนเงิน (บาท)
            <input name="amount" type="number" placeholder="1500" required />
          </label>
          <label>
            สกุลเงิน
            <input name="currency" defaultValue="THB" />
          </label>
          <label>
            สถานะ
            <select name="status" defaultValue="paid">
              <option value="paid">ชำระแล้ว</option>
              <option value="pending">ค้างชำระ</option>
              <option value="failed">ล้มเหลว</option>
            </select>
          </label>
          <label>
            ช่องทางชำระ
            <input name="provider" placeholder="omise" />
          </label>
          <label>
            ผูกกับแพ็กเกจ (ถ้ามี)
            <input name="memberPackageId" placeholder="package id" />
          </label>
          <button type="submit" className="primary-btn">
            บันทึกการชำระเงิน
          </button>
        </form>
        {paymentMessage && <p className="success-text">{paymentMessage}</p>}
        {paymentError && <p className="error-text">{paymentError}</p>}

        <table className="management-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ลูกค้า</th>
              <th>จำนวนเงิน</th>
              <th>สถานะ</th>
              <th>ช่องทาง</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {paymentList.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('th-TH') : '-'}</td>
                <td>{payment.memberName || payment.memberId}</td>
                <td>
                  {payment.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} {payment.currency}
                </td>
                <td>{payment.status}</td>
                <td>{payment.provider}</td>
                <td className="entity-actions">
                  <button type="button" onClick={() => setPaymentEdit(payment)}>
                    แก้ไข
                  </button>
                  <button type="button" className="delete" onClick={() => handlePaymentDelete(payment.id)}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paymentEdit && (
          <form className="admin-form-grid" onSubmit={handlePaymentUpdate} style={{ marginTop: 24 }}>
            <h3 style={{ gridColumn: '1 / -1' }}>แก้ไขการชำระเงิน</h3>
            <label>
              จำนวนเงิน (บาท)
              <input
                type="number"
                value={paymentEdit.amount}
                onChange={(event) =>
                  setPaymentEdit({ ...paymentEdit, amount: Number(event.target.value) || 0 })
                }
              />
            </label>
            <label>
              สกุลเงิน
              <input
                value={paymentEdit.currency}
                onChange={(event) => setPaymentEdit({ ...paymentEdit, currency: event.target.value })}
              />
            </label>
            <label>
              สถานะ
              <select
                value={paymentEdit.status}
                onChange={(event) => setPaymentEdit({ ...paymentEdit, status: event.target.value })}
              >
                <option value="paid">ชำระแล้ว</option>
                <option value="pending">ค้างชำระ</option>
                <option value="failed">ล้มเหลว</option>
              </select>
            </label>
            <label>
              ช่องทาง
              <input
                value={paymentEdit.provider}
                onChange={(event) => setPaymentEdit({ ...paymentEdit, provider: event.target.value })}
              />
            </label>
            <button type="submit" className="primary-btn">
              บันทึกการชำระเงิน
            </button>
            <button type="button" className="ghost-btn" onClick={() => setPaymentEdit(null)}>
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    );
  }

  function renderActivePanel() {
    switch (activeView) {
      case 'branches':
        return renderBranchPanel();
      case 'staff':
        return renderStaffPanel();
      case 'courses':
        return renderCoursePanel();
      case 'customers':
        return renderCustomerPanel();
      case 'payments':
        return renderPaymentPanel();
      default:
        return renderDashboard();
    }
  }

  return (
    <div className="admin-viewport">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <p className="eyebrow">Yoga Backoffice</p>
          <h2>Realtime Console</h2>
          <p>ดูแลข้อมูลทุกสาขา พร้อมอัปเดตผ่าน WebSocket</p>
        </div>
        <div className="admin-session-card">
          <div>
            <p className="session-title">{session.displayName || 'Administrator'}</p>
            <span>{session.metadata?.email || session.referenceId}</span>
          </div>
          <div className={`connection-pill connection-pill--${connectionState}`}>
            <span className="dot" />
            {connectionLabel}
          </div>
          <p className="session-meta">
            เซสชันหมดอายุ {new Date(session.expiresAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <button type="button" className="ghost-btn" onClick={handleLogout}>
            ออกจากระบบ
          </button>
        </div>
        <nav className="admin-side-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeView === item.key ? 'active' : ''}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="tag">Back-office</p>
            <h1>Yoga Admin Dashboard</h1>
            <p>แดชบอร์ดเต็มหน้าจอสำหรับจัดการข้อมูลสาขา คลาส ลูกค้า และธุรกรรมแบบเรียลไทม์</p>
          </div>
          <div className="admin-header__stats">
            <div>
              <p>รายรับเดือนนี้</p>
              <strong>{stats.revenueThisMonth.toLocaleString('th-TH')}</strong>
            </div>
            <div>
              <p>ลูกค้าทั้งหมด</p>
              <strong>{stats.totalCustomers}</strong>
            </div>
            <div>
              <p>คลาสที่กำลังจะถึง</p>
              <strong>{stats.upcomingClasses}</strong>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-content__panel">{renderActivePanel()}</div>
        </div>
      </div>
    </div>
  );
}
