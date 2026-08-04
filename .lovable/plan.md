# Waived / Paid Students: Remove All Payment UI

## Goal

Once a super admin marks a student as **paid** or **waived** (or the program itself is free), the student portal should show no payment obligations at all: no balance, no "Pay Now", no payment-pending warnings, no scholarship application form. Instead they see a clear "100% scholarship — fully sponsored" status.

## What changes for the student

**Dashboard**
- The orange "Payment Pending" banner is hidden for anyone whose payment status is `paid`, `waived`, or whose program is free.
- The "Payment Due / Pay Now" card is replaced by a green "Fully sponsored — no payment required" card for waived/free students (paid students keep the existing "Payment Complete" card).
- Payment history stays visible only if there are actual payment records.

**Payments page**
- Currently only free programs get the "No payment required" screen. This is extended to any student with payment status `paid`... specifically: waived students also see the sponsored screen, with no balance-due figure and no fee breakdown.
- The "Payments" sidebar item is hidden for waived/free students (their record has nothing to pay or show).

**Scholarship page**
- Waived / free students no longer see the application form or the "pay your registration fee first" gate.
- They see a granted-status card: "100% Scholarship — Fully sponsored by PIND" (sponsor name shown when the program has one, otherwise "Fully sponsored").
- On the dashboard, the "Apply for a scholarship" prompt and pop-up are suppressed for these students.

## Sponsor label

To display "Paid by PIND" accurately rather than hard-coding it, programs get an optional **Sponsor** name field, editable in Admin → Programs. When set, sponsored students see "100% Scholarship — paid by {Sponsor}". When empty, they see "100% Scholarship — fully sponsored".

---

## Technical details

**Migration**
- `ALTER TABLE public.programs ADD COLUMN sponsor_name text;`

**Shared helper (new file `src/lib/paymentStatus.ts`)**
- `isPaymentSettled(paymentStatus, isFreeProgram)` → true for `paid`, `waived`, or free program.
- `isSponsored(paymentStatus, isFreeProgram)` → true for `waived` or free program (used for the scholarship/sponsored copy).

**Files to change**
- `src/pages/student/StudentDashboard.tsx` — select `is_free_program` and `sponsor_name` with the program; gate the pending banner, the payment card / Pay Now button, and the scholarship prompt+dialog on the helper; render the sponsored card.
- `src/pages/student/StudentPayments.tsx` — also fetch `payment_status` and `sponsor_name`; broaden the existing free-program early return to cover waived/paid-settled students with the sponsored message.
- `src/pages/student/StudentScholarship.tsx` — fetch `is_free_program` / `sponsor_name`; when sponsored, short-circuit to a granted 100% card and skip the fee gate and application form.
- `src/components/dashboard/DashboardSidebar.tsx` — hide the student "Payments" nav item when the signed-in student's registration is sponsored (small lookup in the sidebar or via a shared hook).
- `src/pages/admin/AdminPrograms.tsx` — add the optional Sponsor field to the program add/edit form.

No changes to Paystack functions or to admin override behaviour; this only reacts to the status the override already sets.
