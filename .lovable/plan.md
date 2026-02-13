

# Fix: Admin Dashboard Not Opening After Login

## Root Cause
Your user account (`ba52da2f-...`) has **two entries** in the `user_roles` table: `admin` and `super_admin`. The `fetchUserRole` function in `useAuth.tsx` uses `.single()`, which crashes when multiple rows are returned (406 error: "Cannot coerce the result to a single JSON object"). This means `role` stays `null`, and the Auth page never redirects you to the dashboard.

## Solution

### 1. Fix `useAuth.tsx` to handle multiple roles
Change `fetchUserRole` to use `.limit(1)` with a priority order instead of `.single()`, so it picks the highest-priority role when a user has multiple entries:

```typescript
const fetchUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .order('role', { ascending: true })
    .limit(1);

  if (data && data.length > 0 && !error) {
    setRole(data[0].role as AppRole);
  } else {
    setRole(null);
  }
};
```

### 2. Clean up duplicate role in database
Remove the redundant `admin` role entry since `super_admin` already grants full admin access. A database migration will delete the duplicate row.

## Files to Change
- `src/hooks/useAuth.tsx` -- replace `.single()` with `.limit(1)` and pick first result
- New SQL migration -- delete the duplicate `admin` role for the affected user

