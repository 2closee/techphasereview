

# Fix Sign In and Enroll Now Button Navigation

## Problem
You are currently logged in as a `super_admin`. When you click "Sign In" or "Enroll Now", you navigate to `/auth`, but the Auth page checks your role and redirects you. The redirect switch statement does not handle `super_admin`, so it falls to `default: navigate('/')` -- sending you right back to the landing page. It looks like the buttons do nothing.

## Solution

### 1. Fix Auth.tsx redirect to handle `super_admin`
Add `super_admin` to the switch statement so logged-in super admins get redirected to `/admin` instead of `/`:

```
case 'super_admin':
case 'admin':
  navigate('/admin');
  break;
case 'accountant':
  navigate('/accountant');
  break;
```

### 2. Fix Auth.tsx redirect to handle `accountant`
The accountant role is also missing from the Auth redirect switch. Add it.

### 3. Update Navbar for logged-in users
Optionally, when a user is already logged in, change the "Sign In" button to "Dashboard" so they go directly to their portal instead of the auth page.

## Files to Change
- `src/pages/Auth.tsx` -- add `super_admin` and `accountant` cases to the redirect switch
- `src/components/landing/Navbar.tsx` -- show "Dashboard" link instead of "Sign In" when user is authenticated

