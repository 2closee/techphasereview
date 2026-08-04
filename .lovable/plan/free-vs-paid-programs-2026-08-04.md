# Free vs Paid Programs

## Goal

Let you mark any program as **Free** or **Paid** from the admin dashboard. Students register for a free program through the normal registration form, skip payment entirely, create their account, and get full student portal access once approved — no payment prompts or warning banners.

This is separate from the existing "Free Short Course (Warri)" flag, which stays as-is for the 3-week Warri course.

## 1. Admin: choose program type

In Admin > Programs, the add/edit dialog gets a **Program Type** selector at the top:

- **Paid program** — shows Tuition Fee and Registration Fee inputs as today.
- **Free program** — hides the fee inputs and stores both fees as 0.

The program list shows a "Free" badge on free programs so you can tell them apart at a glance.

Switching an existing program between free and paid is allowed at any time; it only affects new registrations.

## 2. Registration form (no changes for the student)

The standard registration form stays the same. When the selected program is free:

- The cost summary shows "Free — no payment required" instead of the fee breakdown.
- On submit, the registration is saved with payment marked as waived and payment plan "free".

## 3. Enrollment completion

After submitting, a student on a free program is taken straight to the **Create Account** step — the payment options screen (Pay Online / Installments / Scholarship / Pay at Office) is skipped entirely.

## 4. Student portal

Free-program students see no "complete your payment" banner and have the same access as fully paid students. The Payments page shows "No payment required for this program".

## 5. Admin approval

Admin > Students works as today: you approve the registration. Free students are shown with a "Free" payment badge rather than "Unpaid", and they are eligible for batch assignment and matriculation numbers just like paid students.

---

## Technical details

**Database migration**
- Add `is_free_program boolean not null default false` to `public.programs`.
- Update the `assign_student_to_batch()` trigger so batch assignment and matriculation-number generation fire when `payment_status` becomes `'paid'` **or** `'waived'` (currently only `'paid'`).

**Files to change**
- `src/pages/admin/AdminPrograms.tsx` — add `is_free_program` to the form schema/state, add the Free/Paid type toggle, conditionally hide fee inputs, zero out fees when free, add the "Free" badge in the list.
- `src/pages/StudentRegistration.tsx` — select `is_free_program` in the program query, show a "Free" summary instead of fees, insert `payment_status: 'waived'`, `payment_plan: 'free'` when the chosen program is free.
- `supabase/functions/get-registration-public/index.ts` — include `is_free_program` in the returned program fields.
- `src/pages/CompleteEnrollment.tsx` — treat `payment_status === 'waived'` (or a free program) as payment-complete so the flow jumps to the create-account step.
- `src/pages/student/StudentDashboard.tsx` — exclude `'waived'` from the payment-warning banner condition.
- `src/pages/student/StudentPayments.tsx` — show a "no payment required" state for free programs.
- `src/pages/admin/AdminStudents.tsx` and `src/pages/accountant/AccountantRegistrations.tsx` — render `waived` as a "Free" badge and hide the "Mark Paid" action for those rows.

No changes to Paystack functions; free registrations never touch them.
