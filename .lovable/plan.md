

# Re-run Bootstrap Admin

Call the `bootstrap-admin` edge function with the following payload:

- **email**: Ibinaboloveday@gmail.com
- **password**: Track1989+
- **full_name**: Ibinabo Loveday
- **setup_secret**: SuperAdmin2026!

If it returns a "super_admin already exists" error (from the old project's data), we will need to first check whether the existing super_admin record is in the correct project and clear it if needed.

After successful bootstrap, verify sign-in works at `/admin/auth`.

