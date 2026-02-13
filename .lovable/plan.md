

# Update Project Configuration to New Supabase Project

## Overview
Update all configuration files to point to the new Supabase project `ijmxxysgzkfedumfpyso` with the provided anon key, then redeploy all edge functions.

## Changes

### 1. Update `.env`
- `VITE_SUPABASE_PROJECT_ID`: `esbqtuljvejvrzawsqgk` -> `ijmxxysgzkfedumfpyso`
- `VITE_SUPABASE_URL`: `https://esbqtuljvejvrzawsqgk.supabase.co` -> `https://ijmxxysgzkfedumfpyso.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: update to the new anon key

### 2. Update `src/integrations/supabase/client.ts`
- `SUPABASE_URL`: update to `https://ijmxxysgzkfedumfpyso.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: update to the new anon key

### 3. Update `supabase/config.toml`
- `project_id`: `esbqtuljvejvrzawsqgk` -> `ijmxxysgzkfedumfpyso`

### 4. Redeploy All Edge Functions
Redeploy all 7 edge functions to the new project:
- bootstrap-admin
- cleanup-expired-registrations
- create-staff
- get-registration-public
- paystack-initialize
- paystack-verify
- paystack-webhook

## Important Note
After deployment, you will need to set the required secrets (PAYSTACK_SECRET_KEY, BOOTSTRAP_ADMIN_SECRET, etc.) on the **new** Supabase project since secrets are project-specific and do not carry over.

