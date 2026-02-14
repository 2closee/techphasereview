
# Fix Student Login After Registration

## Problem

Students can't log in after registering because of two issues:

1. **Email confirmation**: The account is created but requires email verification before login works. Students aren't told to check their email and get "Invalid email or password" when trying to sign in.

2. **Silent permission failures**: After account creation, the app tries to assign the student role and link the registration -- but database security policies block these operations for non-admin users. So the account is created in a broken state with no role and no link to the registration.

## Solution

Replace the client-side account creation with a secure server-side Edge Function that handles everything in one step.

### New Edge Function: `create-student-account`

This function will:
- Accept `registration_id`, `password` from the request
- Verify the registration exists and hasn't already created an account
- Create the auth user with email auto-confirmed (no email verification needed)
- Assign the `student` role
- Link the user to the registration record (set `user_id` and `account_created = true`)
- Return success so the frontend can sign the student in immediately

### Frontend Update: `CompleteEnrollment.tsx`

- Replace the direct `supabase.auth.signUp()` call with a call to the new `create-student-account` Edge Function
- On success, sign the student in with `signInWithPassword()` and redirect to the student dashboard

### No database changes needed

The Edge Function uses the service role key (like `create-staff` does), so it bypasses all permission restrictions. No policy changes required.

## Technical Details

### Edge Function: `supabase/functions/create-student-account/index.ts`

```text
Input: { registration_id: string, password: string }
Steps:
  1. Fetch registration from student_registrations (verify exists, not already created)
  2. Check if email already exists in auth.users
     - If yes, use existing user ID
     - If no, create user via admin API with email_confirm: true
  3. Insert student role into user_roles (skip if already exists)
  4. Update student_registrations: set user_id and account_created = true
  5. Return { success: true, email: registration.email }
```

### Frontend change in `CompleteEnrollment.tsx`

Replace lines 229-286 (the `handleCreateAccount` try block) with:
```text
1. Call create-student-account edge function with registration_id + password
2. On success, call signInWithPassword with the email + password
3. Navigate to /student on successful sign-in
```

### Files to change
- **Create**: `supabase/functions/create-student-account/index.ts`
- **Edit**: `src/pages/CompleteEnrollment.tsx` (replace signUp logic with edge function call)
