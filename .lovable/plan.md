

# Fix: Token Refresh Storm Causing All Users to Get Kicked Out

## Root Cause

The auth logs show **dozens of token refresh events per second**, with Supabase returning **429 rate limit errors**. Here is what is happening:

1. Supabase automatically refreshes auth tokens periodically
2. Each token refresh fires `onAuthStateChange` with a `TOKEN_REFRESHED` event
3. The current code responds by setting `loading = true` and re-fetching the role from the database
4. Setting `loading = true` causes `ProtectedRoute` to unmount the dashboard and show a spinner
5. When the dashboard re-mounts, it can trigger more auth state changes, creating a cascade
6. Eventually Supabase hits a 429 rate limit, auth calls fail, and the user gets kicked out

## The Fix

Separate **initial auth loading** from **ongoing auth state changes**. The role should only be re-fetched when the user actually changes (sign in/sign out), not on every token refresh.

### Changes to `src/hooks/useAuth.tsx`

1. Add a separate `initialLoading` flag that only controls the first load
2. In `onAuthStateChange`: 
   - Do NOT set `loading = true` on `TOKEN_REFRESHED` events
   - Only re-fetch the role when the user ID actually changes (sign in / sign out)
   - Cache the current user ID to detect real user changes vs token refreshes
3. In `initializeAuth`: keep existing behavior (await role fetch, then set loading false)

### Changes to `src/components/ProtectedRoute.tsx`

No changes needed -- it already correctly checks `loading` before rendering.

## Technical Details

```text
BEFORE (broken):
  Token refresh -> onAuthStateChange -> loading=true -> unmount dashboard
  -> role fetch -> loading=false -> remount dashboard -> possible cascade

AFTER (fixed):
  Token refresh -> onAuthStateChange -> user ID unchanged -> skip role fetch
  Sign in       -> onAuthStateChange -> user ID changed -> fetch role (no loading flash)
  Initial load  -> loading=true until role fetched -> loading=false -> render dashboard
```

Key implementation points:
- Track `currentUserId` via a ref to detect actual user changes
- On `TOKEN_REFRESHED` or `INITIAL_SESSION` events where user ID hasn't changed, do nothing
- On `SIGNED_IN` with a new user ID, fetch role without setting `loading = true` (the initial load already handles the first render)
- On `SIGNED_OUT`, clear role and user immediately

### File to modify
- `src/hooks/useAuth.tsx` -- refactor onAuthStateChange to avoid re-fetching on token refreshes

