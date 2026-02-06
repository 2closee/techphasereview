
## What’s actually happening (root cause)
Even though we created INSERT RLS policies that allow `anon`/`authenticated` (and even `public`) to insert into `student_registrations`, the frontend code is doing this:

- `insert(...).select('id').single()`

That `.select('id')` forces PostgREST to **read back the inserted row** (RETURNING representation).  
Your database does **not** allow anonymous users to `SELECT` from `student_registrations` (and it shouldn’t, because it contains sensitive data). So the insert may succeed, but the “read back” step fails under RLS, and Supabase surfaces it as:

> new row violates row-level security policy for table "student_registrations"

This is a very common gotcha: “INSERT + returning data” requires SELECT access too.

## Evidence in your project
Current policies on `student_registrations` include:
- INSERT allowed for `anon, authenticated` with `WITH CHECK (true)`
- SELECT allowed only for:
  - admins (via `has_role(...)`)
  - the owner (`auth.uid() = user_id`)

So anonymous users can insert, but they cannot select/return rows. Your code currently tries to return `id` immediately after insert, which triggers the failure.

## Fix strategy (secure and reliable)
### A) Stop requiring SELECT access during registration submit
We’ll change the submit flow so it does not need any SELECT permission:

1. Generate the registration UUID on the client:
   - `const newId = crypto.randomUUID()`
2. Insert including that `id`
3. Use “minimal returning” (or omit `.select()` entirely) so PostgREST does not try to read the row back
4. Navigate using the already-known `newId`

This keeps your table private and still gives you the `registration_id` for the next step.

### B) Make `/complete-enrollment` work without public SELECT on the base table
Right now `CompleteEnrollment.tsx` does a direct `.from('student_registrations').select(...).eq('id', ...)`, which will also fail for anon users once registration starts working.

We’ll move this “lookup by registration_id” to a server-side path that can safely read the row:

Option 1 (recommended): **New Edge Function** `get-registration-public`
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- Accepts `{ registration_id }`
- Returns only the minimum fields the UI needs (name, email, program info, payment_status, account_created)
- The client calls `supabase.functions.invoke('get-registration-public', ...)` instead of direct table select

This avoids adding any public SELECT policy to a PII table.

(Alternative is creating a view that excludes PII and locking down base table SELECT, but your current UI needs email + name anyway, so an edge function is the cleanest approach.)

## Step-by-step implementation plan
### 1) Update `src/pages/StudentRegistration.tsx`
- In `handleConfirmAndProceed`:
  - Create `const newRegistrationId = crypto.randomUUID()`
  - Include `id: newRegistrationId` in the `.insert({ ... })` payload
  - Remove `.select('id').single()`
  - Use `insert(payload, { returning: 'minimal' })` (or omit select entirely)
  - On success, `navigate(`/complete-enrollment?registration_id=${newRegistrationId}`)`

Outcome: registration submission works under RLS without needing SELECT.

### 2) Add a new edge function: `supabase/functions/get-registration-public/index.ts`
- Input: `{ registration_id: string }`
- Validations:
  - registration_id present and is UUID-ish
- Uses service role Supabase client
- Queries `student_registrations` joined to `programs` for:
  - `id, first_name, last_name, email, program_id, payment_status, account_created`
  - `programs (name, tuition_fee, registration_fee)`
- Returns JSON `{ registration: ... }`

Outcome: client can fetch registration details without loosening RLS.

### 3) Update `src/pages/CompleteEnrollment.tsx`
- Replace `fetchRegistration()` implementation:
  - Call `supabase.functions.invoke('get-registration-public', { body: { registration_id: registrationId } })`
  - Use returned data to set `registration` + step logic
- Keep the Paystack verify flow as-is (it already uses edge functions).

Outcome: complete enrollment page works for anonymous users securely.

### 4) (Optional but recommended) Make the “Warri batch count” not rely on public SELECT
`StudentRegistration.tsx` currently tries to count rows in `student_registrations` to show batch info. Anonymous users won’t have SELECT access, so this will often fail silently.

Two safe options:
- Move batch counting to an edge function (service role) that returns just the count
- Or remove the batch preview for anonymous users and only show batch assignment after payment (when you assign batch server-side)

We can decide based on whether that preview is critical.

## Testing checklist (to stop burning tokens)
1. Open `/register` in an incognito window (not logged in)
2. Submit the form and confirm
3. Ensure it redirects to `/complete-enrollment?registration_id=...` without any toast error
4. On `/complete-enrollment`, confirm the registration loads (name/program/fees visible)
5. Click “Pay with Paystack” and ensure initialize works
6. After Paystack redirect back, verify payment updates and “Create account” step appears

## Security notes (important)
- Do not add a public SELECT policy to `student_registrations`. It contains PII and RLS does not protect columns.
- The edge function approach returns only what’s needed and keeps base-table SELECT locked down.

## Files that will change (once you approve)
- Modify: `src/pages/StudentRegistration.tsx`
- Modify: `src/pages/CompleteEnrollment.tsx`
- Add: `supabase/functions/get-registration-public/index.ts`
- Deploy edge function: `get-registration-public`

## Expected result
- Registration submission works immediately (no RLS error)
- Enrollment page loads reliably for anonymous users
- No insecure “public SELECT” access is introduced on PII tables
