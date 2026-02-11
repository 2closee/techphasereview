

# Full Feature Implementation Plan -- Meranos ICT Training Platform

This is a phased implementation plan covering all missing features from the blueprint, organized in dependency order so each phase builds on the previous one.

---

## Phase 1: Database Foundation (Roles, Missing Tables, Triggers)

**Why first:** Everything else depends on the correct role system and schema.

### 1A. Extend the `app_role` enum
- Add `super_admin` and `accountant` to the existing enum (currently: `admin`, `moderator`, `user`, `teacher`, `student`)
- Remove unused legacy roles (`moderator`, `user`) if safe

### 1B. Add missing columns to `profiles`
- `avatar_url` (text) -- for profile photos
- `bio` (text)
- `specialization` (text)
- `is_suspended` (boolean, default false)
- `suspended_at` (timestamptz)
- `suspended_by` (uuid)

### 1C. Create missing tables

| Table | Purpose |
|-------|---------|
| `program_categories` | Dynamic taxonomy (id, name, slug, description, is_active, created_at) |
| `certifications` | Industry cert directory (id, name, provider, description, is_active, created_at) |
| `certification_courses` | Links certifications to programs (id, certification_id, program_id) |
| `cleanup_logs` | Audit trail for expired registration cleanup (id, records_deleted, ran_at, details) |
| `password_reset_tokens` | Secure custom password reset (id, user_id, token, email, expires_at, used, created_at) |

### 1D. Add `settings` table data structure
- The `settings` table exists but is empty and has only `key` (text) and `value` (text) columns
- Alter `value` column to `jsonb` type for structured config storage
- Seed initial settings rows: `academy_name`, `hero_title`, `hero_subtitle`, `hero_badge_text`, `contact_email`, `contact_phone`, `contact_address`, `enrollment_open`, `geofence_radius_meters`, `theme_primary_color`

### 1E. Create database functions and triggers

| Function/Trigger | Purpose |
|-----------------|---------|
| `assign_student_role()` trigger | Auto-grants `student` role when `user_id` is set on `student_registrations` |
| `toggle_user_suspension(target_user_id, suspend boolean)` | SECURITY DEFINER function; only callable by super_admin |
| `is_super_admin(user_id)` | Helper that checks for `super_admin` role (inherits admin + accountant access) |

### 1F. RLS policies for new tables
- `password_reset_tokens`: No public access (edge functions use service role)
- `program_categories`: Public SELECT, admin-only INSERT/UPDATE/DELETE
- `certifications` / `certification_courses`: Same pattern
- `cleanup_logs`: Admin-only SELECT, system INSERT
- Update existing policies to allow `super_admin` access everywhere `admin` is allowed

### 1G. Storage buckets
- Create `program-images` bucket (public) for program banners
- Create `passport-photos` bucket (public) for student ID photos

---

## Phase 2: Edge Functions (5 new + 2 updated)

### 2A. `send-password-reset`
- Accepts `{ email }`
- Looks up user via service role
- Generates secure token, stores in `password_reset_tokens` (1hr expiry)
- Sends email via Resend API
- Returns generic success (no email enumeration)

### 2B. `verify-reset-token`
- Accepts `{ token, new_password }`
- Validates token (exists, not expired, not used)
- Updates password via Supabase Admin API
- Marks token as used

### 2C. `create-staff`
- Accepts `{ email, password, full_name, role }` (admin/teacher/accountant)
- Uses Supabase Admin API (`createUser` with `email_confirm: true`)
- Creates profile entry
- Assigns role in `user_roles`
- Replaces current insecure client-side `signUp` in AdminStaff.tsx

### 2D. `bootstrap-admin`
- One-time setup function to create the initial `super_admin` account
- Checks if any super_admin exists; if not, creates one
- Protected by a setup secret

### 2E. `send-auth-email`
- Branded email via Resend for: signup confirmation, enrollment invitation, password reset
- Uses HTML templates with academy branding from `settings` table

### 2F. `cleanup-expired-registrations`
- Deletes unpaid registrations older than a configurable deadline
- Logs results to `cleanup_logs` table
- Designed to be called via cron or manual trigger

### 2G. `faq-chat` (AI Chatbot)
- Accepts user question, returns streaming SSE response
- Uses OpenAI API (secret already configured)
- System prompt includes academy FAQ content from settings

### 2H. Update `supabase/config.toml`
- Add all new functions with `verify_jwt = false`

---

## Phase 3: Auth & Role System Updates (Frontend)

### 3A. Update `useAuth` hook
- Extend `AppRole` type to include `super_admin` and `accountant`
- `super_admin` should be treated as having both `admin` and `accountant` permissions

### 3B. Update `ProtectedRoute`
- Add `accountant` and `super_admin` to allowed roles
- `super_admin` passes any role check that includes `admin` or `accountant`

### 3C. Update `AdminStaff.tsx`
- Replace client-side `signUp` with call to `create-staff` edge function
- Add `accountant` and `super_admin` to role selection dropdown
- Add suspension toggle button (calls `toggle_user_suspension` RPC)

### 3D. Update `AdminAuth.tsx`
- Add sign-up capability for staff (admin creates accounts, or use invite flow)
- Ensure it routes `super_admin` to admin dashboard, `accountant` to accountant dashboard

### 3E. Update `ForgotPassword.tsx` and `ResetPassword.tsx`
- Use the new `send-password-reset` and `verify-reset-token` edge functions

---

## Phase 4: Settings System & SettingsProvider

### 4A. Create `src/contexts/SettingsContext.tsx`
- `SettingsProvider` component wrapping the app
- Fetches all settings from `settings` table on mount
- Subscribes to Supabase Realtime for live updates
- Exposes `useSettings()` hook returning typed settings object

### 4B. Create Admin Settings Page (`src/pages/admin/AdminSettings.tsx`)
- Tabbed interface with sections:
  - **Academy Branding**: name, logo, description
  - **Hero Banner**: title, subtitle, badge text, stats
  - **Enrollment**: open/closed toggle, deadlines
  - **Attendance**: geofence radius, check-in rules
  - **Program Categories**: CRUD list (from `program_categories` table)
  - **Certifications**: CRUD directory (from `certifications` table)
  - **Appearance/Theme**: primary color picker

### 4C. Update Landing Page to use Settings
- `HeroSection.tsx`: Pull title, subtitle, badge text, stats from `useSettings()`
- `ContactSection.tsx`: Pull address, phone, email from `useSettings()`
- `Navbar.tsx`: Pull academy name from `useSettings()`

---

## Phase 5: Missing Dashboard Pages

### 5A. Admin Pages (3 new)

| Page | File | Features |
|------|------|----------|
| Reports | `src/pages/admin/AdminReports.tsx` | Recharts: enrollment trends, revenue by program, attendance rates, payment status breakdown |
| Payments | `src/pages/admin/AdminPayments.tsx` | List all `enrollment_payments` + `student_payments`, filter by status/program, export |
| Settings | `src/pages/admin/AdminSettings.tsx` | (Covered in Phase 4) |

### 5B. Teacher Pages (4 new)

| Page | File | Features |
|------|------|----------|
| My Classes | `src/pages/teacher/TeacherClasses.tsx` | Sessions assigned to this teacher, grouped by program |
| Students | `src/pages/teacher/TeacherStudents.tsx` | Student roster for assigned classes |
| Timetable | `src/pages/teacher/TeacherTimetable.tsx` | Weekly calendar view of scheduled sessions |
| Grades | `src/pages/teacher/TeacherGrades.tsx` | Grade entry/view for assigned students |
| Profile | `src/pages/teacher/TeacherProfile.tsx` | Edit own profile (name, bio, specialization, avatar) |

### 5C. Student Pages (4 new)

| Page | File | Features |
|------|------|----------|
| My Courses | `src/pages/student/StudentCourses.tsx` | Curriculum view, progress tracker |
| Grades | `src/pages/student/StudentGrades.tsx` | View grades/assessments |
| Payments | `src/pages/student/StudentPayments.tsx` | Payment history, balance due, receipt download |
| Profile | `src/pages/student/StudentProfile.tsx` | Edit profile, upload passport photo to `passport-photos` bucket |

### 5D. Accountant Dashboard (4 new pages)

| Page | File | Features |
|------|------|----------|
| Dashboard | `src/pages/accountant/AccountantDashboard.tsx` | Financial overview: total collected, pending, by program |
| Registrations | `src/pages/accountant/AccountantRegistrations.tsx` | View/manage student registrations |
| Payments | `src/pages/accountant/AccountantPayments.tsx` | Track all payments, mark office payments |
| Reports | `src/pages/accountant/AccountantReports.tsx` | Financial analytics with Recharts |

---

## Phase 6: Routing & Sidebar Updates

### 6A. Update `App.tsx`
- Add routes for all new pages from Phase 5
- Add `/accountant/*` routes with `ProtectedRoute allowedRoles={['accountant', 'super_admin']}`
- Add `/admin/settings` and `/admin/payments` and `/admin/reports` routes

### 6B. Update `DashboardSidebar.tsx`
- Add `accountantNavItems` array
- Add `super_admin` logic (show admin nav items)
- Remove stub links that point to non-existent pages (Payments, Reports, Settings for admin are now real)

### 6C. Update `DashboardLayout.tsx`
- Replace the static Bell button with `<NotificationPopover />` component (already built but not wired in)

---

## Phase 7: PWA & AI Chatbot (Polish Features)

### 7A. PWA Support
- Create `public/manifest.json` with app name, icons, theme color
- Create `public/service-worker.js` for offline caching
- Register service worker in `index.html`
- Create `src/components/PWAInstallBanner.tsx` -- dismissible banner prompting install

### 7B. AI FAQ Chatbot Widget
- Create `src/components/landing/ChatbotWidget.tsx`
  - Floating button in bottom-right corner
  - Opens chat panel with message history
  - Sends messages to `faq-chat` edge function
  - Displays streaming responses via SSE
- Add to `Index.tsx` landing page

---

## Phase 8: Program Image Upload & Optimization

### 8A. Update `AdminPrograms.tsx`
- Add image upload field using `program-images` storage bucket
- Add focal point picker (click on image to set focal coordinates)
- Store `image_url` and focal point in `programs` table

### 8B. Create `src/components/OptimizedImage.tsx`
- Component with blur placeholder loading
- Focal point-based positioning
- Responsive srcset support

---

## Implementation Priority Summary

| Phase | Effort | Dependencies |
|-------|--------|-------------|
| Phase 1: Database | High | None -- do first |
| Phase 2: Edge Functions | High | Phase 1 (tables, roles) |
| Phase 3: Auth Updates | Medium | Phase 1 (roles enum) |
| Phase 4: Settings System | Medium | Phase 1 (settings table) |
| Phase 5: Dashboard Pages | High | Phases 1-3 (roles, auth, data) |
| Phase 6: Routing & Sidebar | Low | Phase 5 (pages exist) |
| Phase 7: PWA & Chatbot | Medium | Phase 2 (faq-chat function) |
| Phase 8: Image Upload | Low | Phase 1 (storage bucket) |

---

## Recommendation

Due to the scope, I recommend implementing this in batches across multiple conversations:
1. **First batch**: Phases 1 + 2 + 3 (foundation)
2. **Second batch**: Phases 4 + 5 + 6 (dashboards)
3. **Third batch**: Phases 7 + 8 (polish)

Each batch can be approved and implemented independently while maintaining a working application at every step.

