-- Some Supabase/PostgREST setups evaluate anon requests under the `public` role.
-- Add an explicit INSERT policy for `public` as well.

DROP POLICY IF EXISTS "Public role can submit registration" ON public.student_registrations;

CREATE POLICY "Public role can submit registration"
ON public.student_registrations
FOR INSERT
TO public
WITH CHECK (true);