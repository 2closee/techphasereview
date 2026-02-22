

# Fix: Super Admin Getting Kicked Out of Dashboard

## Problem

Two issues are causing the super admin to be kicked out:

1. **AdminAuth.tsx** only recognizes the `admin` role, not `super_admin`. When a super_admin logs in through the admin portal, the code treats them as unauthorized and redirects to the homepage with an "Access denied" error.

2. **useAuth.tsx** has a race condition where `loading` is set to `false` before the role has been fetched from the database. This means ProtectedRoute can briefly see a logged-in user with no role, potentially causing incorrect redirects.

## Solution

### 1. Fix AdminAuth.tsx role check
Update the redirect logic to accept both `admin` and `super_admin` roles:

```typescript
if (role === 'admin' || role === 'super_admin') {
  navigate('/admin');
} else {
  toast.error('Access denied. Admin privileges required.');
  navigate('/');
}
```

### 2. Fix the race condition in useAuth.tsx
Ensure `loading` stays `true` until the role has been fully fetched. The key change: don't call `setLoading(false)` until after `fetchUserRole` completes (or after confirming there's no user).

- Make `fetchUserRole` return the result and only set `loading = false` after it finishes
- Remove the `setTimeout` wrapper that defers role fetching
- In both `onAuthStateChange` and `getSession`, keep `loading = true` until role is resolved

### Files to modify
- `src/pages/AdminAuth.tsx` -- add `super_admin` to the role check
- `src/hooks/useAuth.tsx` -- fix loading state to wait for role fetch

