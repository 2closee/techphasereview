# Permanently delete rejected applications

Give admins a way to permanently remove rejected applications — one at a time or all at once — including the applicant's login account.

## Current state

- There are 8 rejected registrations; 6 of them already have a login account.
- None of them have payments recorded, attendance, scholarship applications or matriculation numbers, so nothing of value is lost.
- Records cannot be deleted today: the registrations table has no delete rule at all, so the dashboard can only change status.

## What gets built

**1. A secure delete action (server side)**

A new admin-only server function handles deletion. It checks that the caller is signed in as an admin or super admin, and refuses any registration whose status is not `rejected` — so an approved or enrolled student can never be removed by accident.

For each rejected registration it removes, in order:
- any linked scholarship application, session enrolment, attendance, check-in, progress and payment rows,
- the registration record itself,
- the applicant's login account, profile and student role (as chosen).

It returns how many were deleted and reports anything it had to skip.

**2. Admin UI (Admin -> Students)**

- A red **Delete** button on each row, shown only for rejected entries, with a confirmation dialog naming the applicant and warning that it is permanent.
- A **Delete all rejected** button next to the existing bulk actions, showing the count. It requires typing `DELETE` to confirm, then reports how many were removed.
- The list refreshes after deletion and a toast confirms the result.

## Technical notes

- New edge function `supabase/functions/delete-registrations/index.ts`, using the service role key. It validates the caller's JWT with `getUser()`, then checks `has_role` for `admin`/`super_admin` before doing anything. Registrations are re-read server side and filtered to `status = 'rejected'` — the client's list is never trusted.
- Most child tables already cascade on delete; `scholarship_applications` does not, so those rows are deleted explicitly first.
- Login removal uses `auth.admin.deleteUser`, which cascades the profile row; the `user_roles` row is deleted explicitly.
- No migration is needed — deletion happens with elevated privileges inside the function, so no public delete policy is added to the registrations table (safer than opening delete access to the browser).
- `src/pages/admin/AdminStudents.tsx` gains the row-level delete button, the bulk delete dialog, and calls `supabase.functions.invoke('delete-registrations')`.
