
-- Add accountant SELECT policy on enrollment_payments
CREATE POLICY "Accountants can view enrollment payments"
ON public.enrollment_payments
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant UPDATE policy on enrollment_payments
CREATE POLICY "Accountants can update enrollment payments"
ON public.enrollment_payments
FOR UPDATE
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant SELECT policy on student_registrations
CREATE POLICY "Accountants can view student registrations"
ON public.student_registrations
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant UPDATE policy on student_registrations (for payment_status)
CREATE POLICY "Accountants can update registration payment status"
ON public.student_registrations
FOR UPDATE
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant SELECT policy on student_payments
CREATE POLICY "Accountants can view student payments"
ON public.student_payments
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant INSERT policy on student_payments (to record manual payments)
CREATE POLICY "Accountants can record payments"
ON public.student_payments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant SELECT policy on programs (needed for reports/dashboards)
CREATE POLICY "Accountants can view programs"
ON public.programs
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Add accountant SELECT policy on training_locations
CREATE POLICY "Accountants can view locations"
ON public.training_locations
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));
