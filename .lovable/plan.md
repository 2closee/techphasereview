

# Comprehensive Fix: Student Login, Passport Photo, and Mat Number

## Issues Found

### 1. Why Students Still Can't Login

Investigation revealed the root cause: both test students (`derrickblakex@gmail.com` and `beastgameshows@proton.me`) have **auth.users** entries from the old `signUp()` flow, but:
- **No profile record** in the `profiles` table
- **No student role** in `user_roles`
- **Registration not linked** (`account_created` is still `false`, `user_id` is still `null`)

The `create-student-account` edge function was deployed but has a critical bug: when it finds an existing user (created by the old flow), it **reuses their ID without updating the password**. So the student types a new password on the enrollment page, but the auth account still has the old (possibly forgotten) password. Login fails with "Invalid email or password."

Additionally, the function uses `listUsers()` which fetches ALL users -- this won't scale and is slow.

### 2. Missing Passport Photo Upload

The `passport-photos` storage bucket exists with proper RLS policies, but the `StudentProfile.tsx` page has no upload UI.

### 3. Mat Number Not Shown on Profile

The `matriculation_number` column exists on `student_registrations` and a `generate_matriculation_number` function exists in the database. However, the student profile page doesn't display it.

---

## Plan

### Step 1: Fix the Edge Function (`create-student-account`)

**File**: `supabase/functions/create-student-account/index.ts`

Changes:
- When an existing user is found, **update their password** using `adminClient.auth.admin.updateUserById()` so the new password works immediately
- Replace `listUsers()` (which fetches all users) with `listUsers({ filter: email })` for efficient lookup
- Add better error logging

### Step 2: Fix Existing Broken Accounts (One-Time Data Fix)

Run a data update to link the two existing registrations to their auth accounts, create their profiles, and assign the student role. This fixes the students who are currently stuck.

### Step 3: Add Passport Photo Upload to Student Profile

**File**: `src/pages/student/StudentProfile.tsx`

- Add a photo upload section at the top of the profile card
- Show current passport photo (or a placeholder) in a circular avatar
- Upload button that saves to `passport-photos/{user_id}/passport.jpg` in Supabase Storage
- Save the storage path in `profiles.avatar_url`
- Generate signed URL on-the-fly for display

### Step 4: Display Mat Number on Student Profile

**File**: `src/pages/student/StudentProfile.tsx`

- Fetch the student's `matriculation_number` from `student_registrations` (where `user_id` matches)
- Display it prominently as "Student ID / Mat Number" in a styled badge, read-only

---

## Technical Details

### Edge Function Fix (Step 1)

```text
Key changes in create-student-account/index.ts:

1. Replace listUsers() with targeted email lookup:
   adminClient.auth.admin.listUsers({ filter: email, page: 1, perPage: 1 })

2. When existing user found, update their password:
   adminClient.auth.admin.updateUserById(userId, { 
     password: password,
     email_confirm: true 
   })

3. This ensures the password the student just typed always works.
```

### Data Fix (Step 2)

For the two stuck registrations, the edge function will handle them on next attempt. No manual SQL needed -- students just need to revisit the enrollment page and create their account again.

### Profile Photo Upload (Step 3)

```text
Upload flow:
1. Student selects photo file (accept="image/*")
2. Upload to Supabase Storage: passport-photos/{user_id}/passport.jpg
3. Get public URL (bucket is public)
4. Save URL to profiles.avatar_url
5. Display with circular avatar component

Storage path: passport-photos/{user_id}/passport.jpg
Bucket: passport-photos (already exists, public, with RLS)
```

### Mat Number Display (Step 4)

```text
1. Query student_registrations where user_id = auth.uid()
2. Display matriculation_number in a badge with IdCard icon
3. Read-only field -- students cannot edit this
4. Show "Pending" if not yet assigned
```

### Files to Change

| File | Action |
|------|--------|
| `supabase/functions/create-student-account/index.ts` | Fix password update for existing users, fix listUsers scaling |
| `src/pages/student/StudentProfile.tsx` | Add photo upload, mat number display, redesign layout |

