INSERT INTO student_registrations (
  first_name, last_name, email, phone, gender, date_of_birth,
  state, lga, address, education_level, program_id, preferred_location_id,
  can_attend_weekly, guarantor_full_name, guarantor_address, guarantor_phone,
  guarantor_email, terms_accepted, status, payment_status
) VALUES (
  'Lovable', 'TestStudent', 'lovabletest2026@gmail.com', '08012345678', 'male', '2000-01-15',
  'Rivers', 'Port Harcourt', '10 Test Street, Port Harcourt', 'Primary School',
  '71a41c11-bcc0-48c3-8244-2825a961213a', '9d769a43-4b20-4ec1-864c-c195c3352b3a',
  'Yes', 'John Guarantor', '20 Guarantor Lane, PH', '08098765432',
  'guarantor@test.com', true, 'approved', 'paid'
);