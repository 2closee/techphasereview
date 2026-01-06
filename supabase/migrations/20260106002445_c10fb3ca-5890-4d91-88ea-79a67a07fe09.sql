-- Add payment_status and account_created columns to student_registrations
ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS account_created boolean NOT NULL DEFAULT false;

-- Create enrollment_payments table to track payments before user accounts exist
CREATE TABLE public.enrollment_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.student_registrations(id) ON DELETE CASCADE NOT NULL,
    payment_reference text UNIQUE,
    payment_provider text,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'NGN',
    status text NOT NULL DEFAULT 'pending',
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone
);

-- Enable RLS on enrollment_payments
ALTER TABLE public.enrollment_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert (for payment flow before auth)
CREATE POLICY "Allow public insert for enrollment payments"
ON public.enrollment_payments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow viewing own payments (linked via registration email match)
CREATE POLICY "Users can view their enrollment payments"
ON public.enrollment_payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_registrations sr
        WHERE sr.id = enrollment_payments.registration_id
        AND sr.user_id = auth.uid()
    )
);

-- Policy: Allow admins full access
CREATE POLICY "Admins can manage all enrollment payments"
ON public.enrollment_payments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_enrollment_payments_registration_id ON public.enrollment_payments(registration_id);
CREATE INDEX idx_enrollment_payments_status ON public.enrollment_payments(status);
CREATE INDEX idx_student_registrations_payment_status ON public.student_registrations(payment_status);
CREATE INDEX idx_student_registrations_user_id ON public.student_registrations(user_id);