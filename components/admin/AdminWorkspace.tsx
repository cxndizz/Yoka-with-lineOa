'use client';

import { useState } from 'react';
import type { Branch, Course, Teacher, ClassSchedule } from '@prisma/client';

interface AdminWorkspaceProps {
  branches: Branch[];
  courses: Course[];
  teachers: Teacher[];
  schedules: (ClassSchedule & { branch: Branch; course: Course; teacher: Teacher | null })[];
}

export function AdminWorkspace({ branches, courses, teachers, schedules }: AdminWorkspaceProps) {
  const [branchMessage, setBranchMessage] = useState<string | null>(null);
  const [courseMessage, setCourseMessage] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ branch?: string; course?: string; schedule?: string }>({});

  async function handlePost(url: string, payload: any, onSuccess: (res: Response) => void) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลได้');
    }

    onSuccess(res);
  }

  async function onBranchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors((prev) => ({ ...prev, branch: undefined }));
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await handlePost(
        '/api/admin/branches',
        {
          name: formData.get('name'),
          slug: formData.get('slug'),
          address: formData.get('address'),
          phone: formData.get('phone'),
          locationInfo: formData.get('locationInfo'),
        },
        async () => {
          setBranchMessage('สร้างสาขาเรียบร้อย ✅ (refresh เพื่อดึงรายการล่าสุด)');
          form.reset();
        },
      );
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, branch: error.message }));
      setBranchMessage(null);
    }
  }

  async function onCourseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors((prev) => ({ ...prev, course: undefined }));
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await handlePost(
        '/api/admin/courses',
        {
          name: formData.get('name'),
          level: formData.get('level'),
          description: formData.get('description'),
          durationMin: formData.get('durationMin')
            ? Number(formData.get('durationMin'))
            : undefined,
        },
        async () => {
          setCourseMessage('เพิ่มคอร์สใหม่แล้ว ✅');
          form.reset();
        },
      );
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, course: error.message }));
      setCourseMessage(null);
    }
  }

  async function onScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors((prev) => ({ ...prev, schedule: undefined }));
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await handlePost(
        '/api/admin/class-schedules',
        {
          branchId: formData.get('branchId'),
          courseId: formData.get('courseId'),
          teacherId: formData.get('teacherId') || undefined,
          startAt: formData.get('startAt'),
          endAt: formData.get('endAt'),
          capacity: formData.get('capacity') ? Number(formData.get('capacity')) : undefined,
        },
        async () => {
          setScheduleMessage('ตั้งคลาสใหม่สำเร็จ ✅');
          form.reset();
        },
      );
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, schedule: error.message }));
      setScheduleMessage(null);
    }
  }

  return (
    <div>
      <h2 className="section-heading">สร้างสาขา</h2>
      <form className="form-card" onSubmit={onBranchSubmit}>
        <label>
          ชื่อสาขา
          <input name="name" placeholder="เช่น Siam Square" required />
        </label>
        <label>
          Slug (ภาษาอังกฤษ)
          <input name="slug" placeholder="siam-square" required />
        </label>
        <label>
          ที่อยู่
          <textarea name="address" placeholder="รายละเอียดที่อยู่" />
        </label>
        <label>
          เบอร์ติดต่อ
          <input name="phone" placeholder="02-000-0000" />
        </label>
        <label>
          ข้อมูลแผนที่/การเดินทาง
          <textarea name="locationInfo" placeholder="ลิงก์ Google Maps หรือการเดินทาง" />
        </label>
        <button type="submit" className="primary-btn">
          บันทึกสาขา
        </button>
        {branchMessage && <p className="success-text">{branchMessage}</p>}
        {errors.branch && <p className="error-text">{errors.branch}</p>}
      </form>

      <h2 className="section-heading">เพิ่มคอร์ส</h2>
      <form className="form-card" onSubmit={onCourseSubmit}>
        <label>
          ชื่อคอร์ส
          <input name="name" placeholder="Yin Detox" required />
        </label>
        <label>
          ระดับ (Level)
          <input name="level" placeholder="Beginner / All Level" />
        </label>
        <label>
          ระยะเวลาคลาส (นาที)
          <input type="number" name="durationMin" placeholder="60" />
        </label>
        <label>
          คำอธิบาย
          <textarea name="description" placeholder="รายละเอียดท่าและอุปกรณ์" />
        </label>
        <button type="submit" className="primary-btn">
          บันทึกคอร์ส
        </button>
        {courseMessage && <p className="success-text">{courseMessage}</p>}
        {errors.course && <p className="error-text">{errors.course}</p>}
      </form>

      <h2 className="section-heading">ตั้งตารางเรียน</h2>
      <form className="form-card" onSubmit={onScheduleSubmit}>
        <label>
          สาขา
          <select name="branchId" required defaultValue="">
            <option value="" disabled>
              เลือกสาขา
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          คอร์ส
          <select name="courseId" required defaultValue="">
            <option value="" disabled>
              เลือกคอร์ส
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          ครูผู้สอน (ไม่บังคับ)
          <select name="teacherId" defaultValue="">
            <option value="">ยังไม่ระบุ</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          เวลาเริ่มต้น
          <input type="datetime-local" name="startAt" required />
        </label>
        <label>
          เวลาสิ้นสุด
          <input type="datetime-local" name="endAt" required />
        </label>
        <label>
          จำนวนคนสูงสุด (เว้นว่างหากไม่จำกัด)
          <input type="number" name="capacity" min="1" />
        </label>
        <button type="submit" className="primary-btn">
          สร้างตารางเรียน
        </button>
        {scheduleMessage && <p className="success-text">{scheduleMessage}</p>}
        {errors.schedule && <p className="error-text">{errors.schedule}</p>}
      </form>

      <h2 className="section-heading">ตารางล่าสุด</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>วันเวลา</th>
            <th>คอร์ส</th>
            <th>สาขา</th>
            <th>ครู</th>
            <th>ความจุ</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>
                {new Date(schedule.startAt).toLocaleString('th-TH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </td>
              <td>{schedule.course.name}</td>
              <td>{schedule.branch.name}</td>
              <td>{schedule.teacher?.name || '-'}</td>
              <td>{schedule.capacity || 'ไม่จำกัด'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
