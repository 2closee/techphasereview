

# Migrate Edge Functions to Use Current Lovable Cloud Database

## What's Happening Now
All 7 edge functions (`create-staff`, `bootstrap-admin`, `cleanup-expired-registrations`, `get-registration-public`, `paystack-initialize`, `paystack-verify`, `paystack-webhook`) use `LMS_SUPABASE_URL` and `LMS_SUPABASE_SERVICE_ROLE_KEY` secrets to connect to the external LMS database project (`ijmxxysgzkfedumfpyso`).

Since the edge functions are deployed on the Lovable Cloud project (`esbqtuljvejvrzawsqgk`), they can simply use the built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets that are automatically available to every edge function on that project.

## Changes

### 1. Update All 7 Edge Functions
Replace every occurrence of:
```typescript
Deno.env.get('LMS_SUPABASE_URL')
Deno.env.get('LMS_SUPABASE_SERVICE_ROLE_KEY')
```
with:
```typescript
Deno.env.get('SUPABASE_URL')
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
```

Also update CORS headers in all functions to include the additional Supabase client headers to prevent CORS issues:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

**Files:**
- `supabase/functions/create-staff/index.ts`
- `supabase/functions/bootstrap-admin/index.ts`
- `supabase/functions/cleanup-expired-registrations/index.ts`
- `supabase/functions/get-registration-public/index.ts`
- `supabase/functions/paystack-initialize/index.ts`
- `supabase/functions/paystack-verify/index.ts`
- `supabase/functions/paystack-webhook/index.ts`

### 2. Update Frontend Supabase Client
Update `src/integrations/supabase/client.ts` to point to the Lovable Cloud project so that `supabase.functions.invoke()` calls reach the correct edge functions:
```typescript
const SUPABASE_URL = "https://esbqtuljvejvrzawsqgk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "<lovable cloud anon key>";
```

**Note:** This file is auto-generated but since the app architecture requires all data on the Lovable Cloud project, we need it to point there.

### 3. Redeploy All Edge Functions
After updating, all 7 functions will be redeployed automatically.

## What This Achieves
- All edge functions will read/write data from the same Lovable Cloud database that the frontend uses
- `supabase.functions.invoke()` calls from the frontend will work correctly (no more "Failed to send request" errors)
- No more dependency on the external LMS project
- The built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets are already available -- no new secrets needed

## Important Note
The LMS tables (like `student_registrations`, `programs`, `enrollment_payments`, etc.) must already exist in the Lovable Cloud database for this to work. If they were only in the external project, a database migration will be needed first.

