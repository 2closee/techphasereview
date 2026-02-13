

# Fix: Remove Redundant DROP TRIGGER Statements

## Problem

The `DROP TRIGGER IF EXISTS ... ON public.student_registrations` statements at the top of the script fail on a fresh database because PostgreSQL requires the referenced table to exist -- `IF EXISTS` only checks for the trigger, not the table.

## Solution

Remove all `DROP TRIGGER IF EXISTS` statements (lines 10-22). They are completely redundant because:

- `DROP TABLE IF EXISTS ... CASCADE` (lines 24-45) already removes any triggers on those tables
- `DROP FUNCTION IF EXISTS ... CASCADE` (lines 47-55) already removes triggers that use those functions

## Changes

**File:** `NEW_PROJECT_MIGRATION.sql`

Remove lines 10-22 (all 13 DROP TRIGGER statements):
```sql
-- REMOVE THESE LINES:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_assign_student_role ON public.student_registrations;
DROP TRIGGER IF EXISTS trigger_assign_student_to_batch ON public.student_registrations;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_programs_updated_at ON public.programs;
DROP TRIGGER IF EXISTS update_teachers_updated_at ON public.teachers;
DROP TRIGGER IF EXISTS update_course_batches_updated_at ON public.course_batches;
DROP TRIGGER IF EXISTS update_student_registrations_updated_at ON public.student_registrations;
DROP TRIGGER IF EXISTS update_student_payments_updated_at ON public.student_payments;
DROP TRIGGER IF EXISTS update_training_sessions_updated_at ON public.training_sessions;
DROP TRIGGER IF EXISTS update_training_locations_updated_at ON public.training_locations;
DROP TRIGGER IF EXISTS update_course_progress_updated_at ON public.course_progress;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
```

The `auth.users` trigger is a special case -- we handle it by wrapping in a safe block:
```sql
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
```

No other changes needed. The rest of the script ordering is correct.

