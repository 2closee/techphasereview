

# Activate All Backend Functions, Admin Features, and Mobile-Friendly Buttons

This plan covers building all missing pages across admin, accountant, teacher, and student portals, connecting them to the existing Supabase backend, adding missing routes, and making all buttons responsive on mobile.

---

## Phase 1: Missing Admin Pages

### 1.1 Admin Payments Page (`src/pages/admin/AdminPayments.tsx`)
- New page showing all student payments from the `student_payments` and `enrollment_payments` tables
- Filterable by date range, payment status, payment method
- Summary cards: total collected, pending, this month's revenue
- Table with columns: Student Name, Program, Amount, Type, Method, Reference, Date, Status
- Ability to record manual (cash/bank) payments
- Route: `/admin/payments`

### 1.2 Admin Reports Page (`src/pages/admin/AdminReports.tsx`)
- Revenue summary charts (using recharts, already installed)
- Enrollment trends over time
- Program-wise enrollment breakdown
- Location-wise student distribution
- Attendance summary stats
- Export data capability (CSV download)
- Route: `/admin/reports`

---

## Phase 2: Accountant Portal

### 2.1 Accountant Dashboard (`src/pages/accountant/AccountantDashboard.tsx`)
- Overview cards: Total Revenue, Pending Payments, This Month Collections, Outstanding Balances
- Recent payment activity feed
- Quick action to mark payments as paid
- Route: `/accountant`

### 2.2 Accountant Registrations (`src/pages/accountant/AccountantRegistrations.tsx`)
- View all student registrations with payment status
- Filter by paid/unpaid/partial
- Mark office-based payments as "paid" (update `student_registrations.payment_status`)
- Route: `/accountant/registrations`

### 2.3 Accountant Payments (`src/pages/accountant/AccountantPayments.tsx`)
- Full payment history from `student_payments` and `enrollment_payments`
- Record new manual payments
- Route: `/accountant/payments`

### 2.4 Accountant Reports (`src/pages/accountant/AccountantReports.tsx`)
- Financial reports: revenue by program, by location, by month
- Charts using recharts
- Route: `/accountant/reports`

### 2.5 Database: RLS Policies for Accountant Role
- Add SELECT policies on `student_payments`, `enrollment_payments`, `student_registrations` for the accountant role
- Add UPDATE policy on `student_registrations` (payment_status only) for accountant
- Add INSERT policy on `student_payments` for accountant (to record manual payments)

---

## Phase 3: Teacher Sub-Pages

### 3.1 Teacher Classes (`src/pages/teacher/TeacherClasses.tsx`)
- List programs/batches assigned to the teacher (from `teachers` table linked to programs)
- Show student count per class
- Route: `/teacher/classes`

### 3.2 Teacher Students (`src/pages/teacher/TeacherStudents.tsx`)
- List students in the teacher's assigned programs
- Search and filter
- Route: `/teacher/students`

### 3.3 Teacher Timetable (`src/pages/teacher/TeacherTimetable.tsx`)
- Weekly/daily view of `training_sessions` assigned to teacher
- Route: `/teacher/timetable`

### 3.4 Teacher Grades (`src/pages/teacher/TeacherGrades.tsx`)
- View and update student course progress (from `course_progress` table)
- Route: `/teacher/grades`

### 3.5 Teacher Profile (`src/pages/teacher/TeacherProfile.tsx`)
- View/edit own profile info from `profiles` table
- Route: `/teacher/profile`

---

## Phase 4: Student Sub-Pages

### 4.1 Student Courses (`src/pages/student/StudentCourses.tsx`)
- Detailed view of enrolled program, progress, syllabus
- Route: `/student/courses`

### 4.2 Student Grades (`src/pages/student/StudentGrades.tsx`)
- View own grades/progress from `course_progress`
- Route: `/student/grades`

### 4.3 Student Payments (`src/pages/student/StudentPayments.tsx`)
- Payment history from `student_payments`
- Outstanding balance
- Route: `/student/payments`

### 4.4 Student Profile (`src/pages/student/StudentProfile.tsx`)
- View/edit own profile
- Route: `/student/profile`

---

## Phase 5: Route Registration and Navigation

### 5.1 Update `src/App.tsx`
- Add all new routes:
  - `/admin/payments` and `/admin/reports`
  - `/accountant`, `/accountant/registrations`, `/accountant/payments`, `/accountant/reports`
  - `/teacher/classes`, `/teacher/students`, `/teacher/timetable`, `/teacher/grades`, `/teacher/profile`
  - `/student/courses`, `/student/grades`, `/student/payments`, `/student/profile`
- Add `allowedRoles` including `'accountant'` for accountant routes

### 5.2 Update `src/components/ProtectedRoute.tsx`
- Already handles accountant redirect -- no changes needed

---

## Phase 6: Mobile-Friendly Buttons

### 6.1 Global Button Improvements (`src/components/ui/button.tsx`)
- Add minimum touch target size (44px) for mobile
- Ensure adequate padding on small screens

### 6.2 Page-Level Responsive Fixes
- All action buttons in tables: use icon-only on mobile, full text on desktop
- Dialog/modal buttons: full-width on mobile (`w-full sm:w-auto`)
- Dashboard quick action cards: proper touch targets
- Sidebar nav items: adequate spacing for touch
- Landing page CTA buttons: proper sizing on all breakpoints
- Table action columns: wrap or stack buttons on small screens

---

## Technical Details

### New Files to Create (approximately 14 new page files):
- `src/pages/admin/AdminPayments.tsx`
- `src/pages/admin/AdminReports.tsx`
- `src/pages/accountant/AccountantDashboard.tsx`
- `src/pages/accountant/AccountantRegistrations.tsx`
- `src/pages/accountant/AccountantPayments.tsx`
- `src/pages/accountant/AccountantReports.tsx`
- `src/pages/teacher/TeacherClasses.tsx`
- `src/pages/teacher/TeacherStudents.tsx`
- `src/pages/teacher/TeacherTimetable.tsx`
- `src/pages/teacher/TeacherGrades.tsx`
- `src/pages/teacher/TeacherProfile.tsx`
- `src/pages/student/StudentCourses.tsx`
- `src/pages/student/StudentGrades.tsx`
- `src/pages/student/StudentPayments.tsx`
- `src/pages/student/StudentProfile.tsx`

### Files to Modify:
- `src/App.tsx` -- add all new routes
- `src/components/ui/button.tsx` -- enhance mobile touch targets
- `src/components/dashboard/DashboardLayout.tsx` -- responsive header improvements
- `src/pages/admin/AdminDashboard.tsx` -- responsive button fixes
- `src/pages/admin/AdminStaff.tsx` -- responsive table actions
- Various existing pages -- ensure buttons are mobile-friendly

### Database Migration:
- Add RLS policies for `accountant` role on `student_payments`, `enrollment_payments`, and `student_registrations` tables

### Implementation Order:
1. Database migration (accountant RLS policies)
2. Button component mobile improvements
3. Admin Payments and Reports pages
4. Accountant portal (4 pages)
5. Teacher sub-pages (5 pages)
6. Student sub-pages (4 pages)
7. Route registration in App.tsx
8. Responsive fixes across all existing pages

