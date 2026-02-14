
-- Add payment_plan column to student_registrations for installment tracking
ALTER TABLE public.student_registrations 
ADD COLUMN IF NOT EXISTS payment_plan text NOT NULL DEFAULT 'full';

-- Add comment for clarity
COMMENT ON COLUMN public.student_registrations.payment_plan IS 'Payment plan: full, 2_installments, 3_installments, office_pay';
