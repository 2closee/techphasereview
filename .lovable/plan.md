

# Migration Plan: Move LMS to a New Supabase Project

## Overview

You will create a brand-new Supabase project. I will then generate a single SQL script you run in that new project to recreate every LMS table, function, trigger, RLS policy, and storage bucket. Then we reconnect this Lovable project to the new database and redeploy edge functions.

**FixBudi stays completely untouched** -- we never modify, delete, or run anything on the old database.

---

## Step 1: You Create a New Supabase Project (manual)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose a name like `meranos-lms`
4. Pick a region close to your users (e.g. EU West or US East)
5. Set a database password (save it)
6. Once created, copy these 3 values from **Settings > API**:
   - Project URL (e.g. `https://xxxxx.supabase.co`)
   - Anon/public key
   - Service role key (for edge functions)

Come back here and share the **Project URL** and **Anon key**. I will handle the rest.

---

## Step 2: I Generate the Full Migration SQL

A single SQL script you paste into the new project's **SQL Editor** containing:

### 2A. Enum and shared infrastructure
- `app_role` enum with exactly: `admin`, `super_admin`, `accountant`, `teacher`, `student`
- No FixBudi-specific enums (`job_status`, `payment_type`, `dispute_status`, etc.)

### 2B. Core tables (4)
- `profiles` (with all LMS columns: avatar_url, bio, specialization, is_suspended, etc.)
- `user_roles` (user_id + app_role, unique constraint)
- `settings` (key text PK, value jsonb) with seeded defaults
- `notifications` (user_id, title, message, type, is_read, etc.)

### 2C. LMS-specific tables (12+)

| Table | Key columns |
|-------|-------------|
| `programs` | name, description, duration, fee, category_id, image_url, program_code |
| `program_categories` | name, slug, description, is_active |
| `certifications` | name, provider, description, is_active |
| `certification_courses` | certification_id, program_id |
| `training_locations` | name, address, latitude, longitude, geofence_radius, location_code |
| `location_programs` | location_id, program_id, is_active |
| `student_registrations` | full enrollment record with payment_status, matriculation_number, batch_id, user_id |
| `enrollment_payments` | registration_id, amount, status, payment_reference |
| `course_batches` | program_id, location_id, batch_number, current_count, max_students, status |
| `attendance` | student_id, program_id, date, status, marked_by |
| `geolocation_checkins` | student_id, session_id, latitude, longitude, is_within_geofence |
| `course_progress` | student_id, program_id, completion_percentage, status |
| `cleanup_logs` | records_deleted, ran_at, details |
| `password_reset_tokens` | user_id, token, email, expires_at, used |

### 2D. Database functions (6)

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger on auth.users to auto-create profile |
| `has_role()` | RLS helper |
| `is_super_admin()` | RLS helper |
| `get_user_role()` | Returns user's role |
| `assign_student_role()` | Trigger: auto-grants student role on registration link |
| `assign_student_to_batch()` | Trigger: auto-assigns batch + matriculation number on payment |
| `generate_matriculation_number()` | Generates formatted ID |
| `toggle_user_suspension()` | Super-admin only suspension |
| `update_updated_at_column()` | Generic timestamp trigger |

### 2E. Triggers
- `handle_new_user` on `auth.users`
- `trg_assign_student_role` on `student_registrations`
- `trg_assign_student_to_batch` on `student_registrations`
- `update_updated_at` on `profiles`, `course_batches`, etc.

### 2F. RLS policies
- Every table gets `ENABLE ROW LEVEL SECURITY`
- All existing LMS policies recreated exactly
- No FixBudi policies included

### 2G. Storage buckets
- `program-images` (public) with admin upload policies
- `passport-photos` (public) with student-scoped upload policies

### 2H. Settings seed data
- Academy name, hero text, contact info, enrollment status, geofence radius, theme color

---

## Step 3: I Update the Lovable Project

### 3A. Update environment and client
- Update `.env` with new `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- Update `src/integrations/supabase/client.ts` with new credentials

### 3B. Clean up `types.ts`
- Remove all FixBudi table types: `Repair Center`, `repair_jobs`, `repair_center_staff`, `repair_center_reviews`, `repair_warranties`, `conversations`, `messages`, `diagnostic_conversations`, `diagnostic_messages`, `diagnostic_reports`, `delivery_requests`, `delivery_commissions`, `delivery_status_history`, `completion_feedback_notifications`, `logistics_provider_settings`, `payout_settings`, `payments`, `email_notifications`, `email_logs`, `disputes`, `support_tickets`
- Remove FixBudi enums: `job_status`, `payment_status`, `payment_type`, `dispute_status`, `ticket_priority`, `ticket_status`, `warranty_type`
- Keep only LMS tables and the `app_role` enum

### 3C. Update `supabase/config.toml`
- Update `project_id` to the new project
- Keep all existing function configs

### 3D. Add secrets to the new project
The following secrets need to be added to the **new** Supabase project:
- `PAYSTACK_SECRET_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `BOOTSTRAP_ADMIN_SECRET`

### 3E. Redeploy all edge functions
- `bootstrap-admin`
- `create-staff`
- `cleanup-expired-registrations`
- `get-registration-public`
- `paystack-initialize`
- `paystack-verify`
- `paystack-webhook`

---

## Step 4: Verify Everything Works

- Landing page loads with settings from new DB
- Admin login works
- Student registration flow works
- Edge functions respond correctly

---

## What You Do vs. What I Do

| Task | Who |
|------|-----|
| Create new Supabase project | You |
| Share new URL + anon key | You |
| Generate full migration SQL | Me |
| Run migration SQL in new project SQL Editor | You |
| Update Lovable project code + env | Me |
| Add secrets to new project | You (via Supabase dashboard or Lovable secrets tool) |
| Deploy edge functions | Me |
| Clean up types.ts | Me |
| Test end-to-end | Both |

---

## Important Notes

- **FixBudi is never touched.** No drops, no modifications, no migrations run on the old DB.
- **User accounts don't transfer.** You'll use `bootstrap-admin` to create the first super_admin on the new project, then `create-staff` for other staff.
- **No student data to migrate** (unless you have real students already enrolled -- let me know).
- The old Supabase project continues running FixBudi independently.

---

## Next Step

Create your new Supabase project and share the **Project URL** and **Anon key** with me. I'll then generate the complete migration SQL and update all the code.

