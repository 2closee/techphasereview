INSERT INTO public.programs (name, description, category, duration, duration_unit, tuition_fee, registration_fee, is_active, is_free_short_course)
VALUES ('Free ICT Short Course', 'A free 3-week introductory course covering basic ICT skills including computer literacy, internet usage, and digital fundamentals. Available exclusively at the Warri Training Center.', 'software', '3', 'weeks', 0, 0, true, true);

-- Link the new program to the Warri location
INSERT INTO public.location_programs (location_id, program_id, is_active)
SELECT '7372a25c-bdde-4a22-ad06-4a1c52a96907', id, true
FROM public.programs WHERE name = 'Free ICT Short Course' AND is_free_short_course = true
LIMIT 1;