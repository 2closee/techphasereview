

# Email Notifications, Pop-up Notifications, and Scholarship Prompt

## What This Covers

1. **Email notifications** when a scholarship decision is made (approved/denied)
2. **Pop-up notification bell** working for all account types (currently broken -- the bell icon exists but doesn't use the `NotificationPopover` component)
3. **Scholarship prompt dialog** shown to students on dashboard login directing them to apply

---

## Part 1: Fix Pop-up Notifications for All Accounts

The `NotificationPopover` component already exists and works, but `DashboardLayout.tsx` uses a dummy Bell button instead of it. This is a simple swap.

**File: `src/components/dashboard/DashboardLayout.tsx`**
- Replace the static `<Bell>` button with the existing `<NotificationPopover />` component
- This immediately enables real-time notification pop-ups for all roles (admin, teacher, student, accountant)

---

## Part 2: Email Notifications on Scholarship Decisions

### New Edge Function: `send-scholarship-email`

**File: `supabase/functions/send-scholarship-email/index.ts`**

- Accepts `{ to, studentName, status, grantedPercentage, programName, adminNotes }`
- Sends an email using Supabase's built-in `auth.admin` email or a simple SMTP relay
- Since no external email service is configured, this will use **Supabase's Resend integration** (built-in for transactional emails via `supabase.auth.admin.generateLink`) -- or we can use a simpler approach: store the email content and use Supabase's built-in email hook

**Practical approach**: Create an edge function that calls the Resend API (free tier: 100 emails/day). This requires a `RESEND_API_KEY` secret.

- Approved email: congratulates the student, states the discount percentage, and provides next steps
- Denied email: informs the student respectfully, includes admin notes if any, and suggests contacting the office

### Update: `src/pages/admin/AdminScholarships.tsx`

- After updating the scholarship status and creating the in-app notification, call the `send-scholarship-email` edge function
- Pass student email, name, decision, percentage, and program name

---

## Part 3: Scholarship Prompt on Student Dashboard Login

**File: `src/pages/student/StudentDashboard.tsx`**

- Add a **dismissible dialog/modal** that shows on first load when the student has NOT yet applied for a scholarship
- Message: "Need Financial Assistance? You may be eligible for a scholarship covering 30--100% of your tuition. Apply now!"
- "Apply Now" button links to `/student/scholarship`
- "Maybe Later" dismisses the dialog
- Uses `sessionStorage` to avoid showing it repeatedly during the same session
- Only shows if `scholarshipStatus` is null (no existing application)

---

## Technical Details

### Edge Function: `send-scholarship-email`

```text
Request body:
{
  to: string (email),
  studentName: string,
  status: "approved" | "denied",
  grantedPercentage: number | null,
  programName: string,
  adminNotes: string | null
}
```

- Uses CORS headers consistent with other edge functions
- Requires `RESEND_API_KEY` secret (free tier supports 100 emails/day, sufficient for scholarship decisions)
- Sends a nicely formatted HTML email

### Files to Create
- `supabase/functions/send-scholarship-email/index.ts`

### Files to Modify
- `src/components/dashboard/DashboardLayout.tsx` -- swap dummy bell for `NotificationPopover`
- `src/pages/admin/AdminScholarships.tsx` -- call email edge function after decision
- `src/pages/student/StudentDashboard.tsx` -- add scholarship prompt dialog
- `supabase/config.toml` -- add function config with `verify_jwt = false`

### Secret Required
- `RESEND_API_KEY` -- will ask you to provide this after confirming the approach
