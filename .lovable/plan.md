

# Update LMS_SUPABASE_URL and Re-run Bootstrap

## Step 1: Update the Secret
Set `LMS_SUPABASE_URL` to exactly: `https://ijmxxysgzkfedumfpyso.supabase.co`

## Step 2: Deploy and Execute
- Redeploy the `bootstrap-admin` edge function
- Call it with:
  - **email**: Ibinaboloveday@gmail.com
  - **password**: Track1989+
  - **full_name**: Ibinabo Loveday
  - **setup_secret**: SuperAdmin2026!

## Step 3: Verify
- Check logs to confirm the URL is now correct
- Confirm the response indicates successful super admin creation
- If "super_admin already exists" error appears, investigate whether it's from a previous successful attempt

