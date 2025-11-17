# Yoga Booking via LINE OA + Next.js + Omise

โปรเจกต์นี้เป็นโครงสร้างพื้นฐาน (starter) สำหรับระบบจองคอร์สโยคะหลายสาขา
เชื่อมต่อกับ LINE OA (ผ่าน LIFF / LINE Login) และรองรับการจ่ายเงินผ่าน Omise
รวมถึงรองรับการเก็บรูปคอร์สและแปลงเป็น WebP (ส่วน image processing ให้คุณเติมเพิ่มภายหลัง)

## โครงสร้างหลัก

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma
- Omise (ผ่าน Node SDK)
- พร้อม API พื้นฐานสำหรับ:
  - auth/line
  - me
  - branches
  - branches/:branchId/classes
  - bookings (+ ยกเลิก)
  - packages
  - me/packages
  - packages/:id/purchase
  - omise/webhook

> หมายเหตุ: ส่วน Auth ในตัวอย่างยังเป็น mock (ใช้ member แรกในฐานข้อมูล)
> คุณต้องต่อระบบ session / JWT / LINE Login จริงอีกที

## การติดตั้งและใช้งาน

### 1. แตกไฟล์โปรเจกต์

```bash
unzip yoga-line-yoga-booking.zip
cd yoga-line-yoga-booking
```

หรือถ้าคุณ copy โฟลเดอร์ไปไว้เองก็เพียงเข้าไปในโฟลเดอร์โปรเจกต์

### 2. ติดตั้ง dependency

```bash
npm install
# หรือ
# yarn
# หรือ
# pnpm install
```

### 3. ตั้งค่า environment variables

คัดลอกไฟล์ `.env.example` เป็น `.env` แล้วแก้ค่าตามจริง:

```bash
cp .env.example .env
```

แก้ไขค่า:

- `DATABASE_URL` เป็น URL ของ PostgreSQL ของคุณ
- `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_LOGIN_CALLBACK_URL`
  - สำหรับใช้กับ LINE Login / LIFF (ตอนนี้ยังไม่ต่อให้ครบ ใช้เป็น placeholder ไว้)
- `NEXT_PUBLIC_LIFF_ID`
  - ใช้บนหน้า `/liff` เพื่อให้ LIFF SDK รู้ว่าจะ init ด้วยไอดีใด (จำเป็นต้องตั้งค่าจริงก่อนใช้งาน)
- `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`
  - จาก Omise Dashboard
- `APP_BASE_URL`
  - เช่น `http://localhost:3000` ในตอน dev
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  - ตั้งค่าบัญชีสำหรับเข้า Backoffice dashboard (ค่าเริ่มต้นคือ `admin@yogaclub.com` / `supersecret`)

### 4. สร้างฐานข้อมูลด้วย Prisma

```bash
npx prisma migrate dev --name init
```

หรือใช้ script:

```bash
npm run prisma:migrate
```

### 5. รันเว็บในโหมด Dev

```bash
npm run dev
```

จากนั้นเปิด browser ไปที่:

- `http://localhost:3000` → หน้า Home
- `http://localhost:3000/api/branches` → ลองเรียก API (ถ้ามี data แล้ว)

### 6. เติมข้อมูลเริ่มต้น (seed) ด้วยตัวเอง

ตอนนี้โปรเจกต์ยังไม่มีสคริปต์ seed ให้อัตโนมัติ คุณสามารถ:

- ใช้ Prisma Studio:

  ```bash
  npx prisma studio
  ```

  แล้วเพิ่ม:
  - Branch อย่างน้อย 1 ตัว
  - Course + CourseImage
  - ClassSchedule ที่ผูกกับ Branch + Course
  - Member (สร้างผ่าน `/api/auth/line` หรือสร้างใน Studio ก่อนก็ได้)

### 7. ทดลอง Flow พื้นฐาน (แบบ mock auth)

เนื่องจากตอนนี้ auth ยังเป็น mock (ใช้ member แรกใน DB):

1. สร้าง Member สักหนึ่งคนใน Prisma Studio (table Member)
2. สร้าง Branch, Course, ClassSchedule
3. ลองเรียก:

   - `GET /api/branches`
   - `GET /api/branches/{branchId}/classes?date=YYYY-MM-DD`
   - `GET /api/bookings`
   - `POST /api/bookings` ด้วย body:
     ```json
     {
       "class_schedule_id": "ID ของ class schedule"
     }
     ```
   - `GET /api/packages`
   - `POST /api/packages/{packageId}/purchase`

### 8. ต่อกับ LINE OA / LIFF (แนวทาง)

- ตั้งค่า LIFF App ใน LINE Developers Console
- ให้ LIFF URL ชี้มาที่ `/liff` ของโปรเจกต์นี้
- ในไฟล์ `app/liff/page.tsx`:
  - เพิ่ม script โหลด LIFF SDK
  - `liff.init({ liffId })`
  - `liff.getProfile()` เพื่อดึง `userId`, displayName, pictureUrl
  - ส่งข้อมูลไปที่ `/api/auth/line` ผ่าน fetch
  - จากนั้น redirect ผู้ใช้ไปที่หน้า booking จริง เช่น `/branches` หรือ `/classes`

### 9. แปลงรูปเป็น WebP

ตอนนี้มีโครงสร้าง DB สำหรับเก็บ:

- `course_images.originalUrl`
- `course_images.webpUrl`

คุณสามารถเพิ่ม API/ฟังก์ชันอัปโหลดรูปใน:

- `app/api/admin/courses/[courseId]/images/route.ts` (ยังไม่ได้สร้าง)
  - รับไฟล์ (ผ่าน `form-data`)
  - ใช้ไลบรารี `sharp` แปลงไฟล์เป็น webp
  - อัปโหลดทั้งไฟล์ต้นฉบับและ webp ไปเก็บใน object storage
  - บันทึก URL ลงในตาราง `CourseImage`

### 10. คำเตือน/ข้อควรปรับก่อนใช้จริง

- ระบบ auth ต้องทำให้สมบูรณ์:
  - ผูกกับ LINE Login / LIFF จริง
  - ใช้ session / JWT / cookie ปลอดภัย
- ตรวจสอบ Omise webhook signature ก่อน update payment / memberPackage
- เพิ่ม validation ต่าง ๆ:
  - นโยบายยกเลิกคลาส
  - กัน overbook ด้วย transaction ระดับฐานข้อมูล
- เพิ่ม role-based access control (RBAC) สำหรับ admin endpoints

---

โปรเจกต์นี้ตั้งใจให้เป็น “จุดเริ่มต้นที่มีโครงครบแล้ว”
คุณสามารถต่อยอด UI, auth, payment และ image processing เข้าไปได้ทันทีโดยไม่ต้องออกแบบ schema และ API ใหม่ทั้งหมด
