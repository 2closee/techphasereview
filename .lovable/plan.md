

# Fix: Bootstrap Admin in the Correct Supabase Project

## Problem
The `bootstrap-admin` edge function created the super_admin account in the wrong Supabase project. Edge functions deployed via Lovable run on `esbqtuljvejvrzawsqgk` (FixBudi), but the frontend authenticates against `ijmxxysgzkfedumfpyso` (the new LMS project). The user account needs to exist in the LMS project.

## Solution

### 1. Add New Secrets for the LMS Project
Add two new secrets to the Lovable-connected Supabase project so the edge function can target the correct database:
- `LMS_SUPABASE_URL` = `https://ijmxxysgzkfedumfpyso.supabase.co`
- `LMS_SUPABASE_SERVICE_ROLE_KEY` = (the service role key from the new LMS project -- the user will need to provide this from the ijmxxysgzkfedumfpyso project dashboard)

### 2. Update `bootstrap-admin` Edge Function
Change the function to use `LMS_SUPABASE_URL` and `LMS_SUPABASE_SERVICE_ROLE_KEY` instead of the default `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, so the user is created in the correct project.

### 3. Re-run the Bootstrap
Call the updated `bootstrap-admin` function again with:
- email: Ibinaboloveday@gmail.com
- password: Track1989+
- full_name: Ibinabo Loveday
- setup_secret: SuperAdmin2026!

### 4. Update Other Edge Functions
Review and update all other edge functions (`create-staff`, `paystack-*`, `get-registration-public`, `cleanup-expired-registrations`) to also use `LMS_SUPABASE_URL` and `LMS_SUPABASE_SERVICE_ROLE_KEY` so they operate on the correct project.

## What You Need to Provide
The **service role key** for the new LMS Supabase project (`ijmxxysgzkfedumfpyso`). You can find it at:
**Supabase Dashboard > Project Settings > API > service_role key (secret)**
for the `ijmxxysgzkfedumfpyso` project.

