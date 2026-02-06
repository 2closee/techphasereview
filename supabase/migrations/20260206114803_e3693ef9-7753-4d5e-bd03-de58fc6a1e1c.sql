-- Drop the existing insert policy and recreate with explicit anon role
DROP POLICY IF EXISTS "Anyone can submit registration" ON public.student_registrations;

-- Create a new policy that explicitly allows anonymous and authenticated users to insert
CREATE POLICY "Public can submit registration" 
ON public.student_registrations 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);