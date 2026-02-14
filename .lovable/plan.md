
# Fix: Deploy Missing Edge Functions

## Root Cause

The "Failed to load registration" error occurs because the `get-registration-public` edge function is **not deployed** to Supabase. After the registration form submits successfully, it redirects to `/complete-enrollment?registration_id=...`, which calls this function to fetch the registration details. Since the function doesn't exist on the server, the call fails and shows the error.

## Investigation Results

| Edge Function | Status |
|---|---|
| `create-student-account` | Deployed (working) |
| `get-registration-public` | **NOT deployed** |
| `paystack-initialize` | **NOT deployed** |
| `paystack-verify` | **NOT deployed** |
| `paystack-webhook` | Not tested (webhook) |
| `bootstrap-admin` | Not tested |
| `create-staff` | Not tested |
| `change-staff-password` | Not tested |
| `cleanup-expired-registrations` | Not tested |

## Fix

Deploy all missing edge functions. The code already exists in the `supabase/functions/` directory and is correct -- they just need to be deployed.

### Step 1: Deploy all edge functions

Deploy every function in the `supabase/functions/` directory:
- `get-registration-public`
- `paystack-initialize`
- `paystack-verify`
- `paystack-webhook`
- `bootstrap-admin`
- `create-staff`
- `change-staff-password`
- `cleanup-expired-registrations`

### Step 2: Verify the fix

After deployment, test the `get-registration-public` function to confirm it responds correctly, then re-test the student registration flow end-to-end.

## No Code Changes Needed

The function code is already correct. This is purely a deployment issue -- the functions exist in the codebase but were never deployed to this Supabase project.
