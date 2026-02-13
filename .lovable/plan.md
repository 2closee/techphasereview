

# Reset Bootstrap Secret and Create Super Admin

## Steps

### 1. Reset the `BOOTSTRAP_ADMIN_SECRET`
Set the secret value to `SuperAdmin2026!` on the Supabase project.

### 2. Fix `.env` Configuration
The `.env` file has reverted back to the old project ID (`esbqtuljvejvrzawsqgk`). It needs to be updated back to the new project (`ijmxxysgzkfedumfpyso`) with the correct anon key.

### 3. Call the `bootstrap-admin` Edge Function
Send a POST request to the deployed `bootstrap-admin` function with:
- **email**: Ibinaboloveday@gmail.com
- **password**: Track1989+
- **full_name**: Ibinabo Loveday
- **setup_secret**: SuperAdmin2026!

This will create the first super_admin account in the new Supabase project.

