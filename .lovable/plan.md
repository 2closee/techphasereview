
# Fix Super Admin Dashboard: Settings, Programs, Staff, and Account Management

## Root Cause

All RLS (Row-Level Security) policies in the database check for the `admin` role using `has_role(auth.uid(), 'admin')`. Since your account has the `super_admin` role (not `admin`), every query silently returns empty results or blocks writes. This is why:

- **Settings fail to save** -- the INSERT/UPDATE policies only allow `admin`
- **Programs don't save** -- the INSERT/UPDATE policies only allow `admin`
- **Staff list is empty** -- the SELECT policy on `user_roles` and `profiles` only allows `admin`

## Plan

### 1. Fix the `has_role` database function to treat `super_admin` as having all permissions

Instead of updating dozens of individual policies, we modify the single `has_role` function so that a `super_admin` automatically passes any role check:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'super_admin')
  );
$$;
```

This single change instantly fixes settings saving, programs CRUD, staff list visibility, and all other admin-gated features for `super_admin` users.

### 2. Add a "Partial Payment" settings tab

- Add a new setting key `partial_payment_percentage` (default 50) to the Settings page
- Add a new tab in `AdminSettings.tsx` called "Payment Plans" where the super admin can configure the minimum percentage required for partial/installment payments
- The `CompleteEnrollment.tsx` page will read this setting to calculate installment amounts

### 3. Add profiles INSERT policy

Currently the `profiles` table has no INSERT policy, which may cause issues when the `create-staff` edge function tries to upsert profiles. Add a policy allowing service-role inserts (or use a trigger). Since the edge function uses the service role key, this is handled, but we should also allow admin inserts for safety.

### 4. Add "Change Password" for staff accounts

Create a new edge function `change-staff-password` that:
- Accepts `{ user_id, new_password }` 
- Verifies the caller is `super_admin`
- Uses `adminClient.auth.admin.updateUserById()` to change the password

Add a "Change Password" button to each staff row in `AdminStaff.tsx` with a dialog to enter the new password.

### 5. Summary of file changes

**Database migration (single SQL file):**
- Update `has_role` function to include `super_admin` fallback
- No table structure changes needed

**New edge function:**
- `supabase/functions/change-staff-password/index.ts` -- password reset for staff by super admin

**Frontend files to modify:**
- `src/pages/admin/AdminSettings.tsx` -- add "Payment Plans" tab with partial payment percentage setting
- `src/pages/admin/AdminStaff.tsx` -- add "Change Password" button and dialog for each staff member
- `src/pages/CompleteEnrollment.tsx` -- read `partial_payment_percentage` setting to calculate installment amounts

## Technical Details

### has_role fix
The key insight: rather than adding `OR has_role(auth.uid(), 'super_admin')` to every single RLS policy (20+ policies across many tables), we modify the `has_role` function itself. When checking if a user has role X, it also returns true if the user has `super_admin`. This is a standard hierarchical role pattern.

### Payment Plans tab
Will include:
- A numeric input for "Minimum first payment percentage" (e.g., 50%)
- This value is stored as a setting key `partial_payment_percentage` in the `settings` table
- The enrollment flow reads this to calculate how much each installment should be

### Change Password edge function
- Protected by checking caller's `super_admin` role via the service role client
- Uses Supabase Admin API: `auth.admin.updateUserById(userId, { password: newPassword })`
- Minimum password length validation (6 characters)
