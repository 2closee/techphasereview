-- Update Port Harcourt center address
UPDATE training_locations 
SET address = '274 Port Harcourt - Aba Expy',
    city = 'Port Harcourt',
    updated_at = now()
WHERE code = 'PHC';

-- Update Warri center address
UPDATE training_locations 
SET address = '71 Airport Road',
    city = 'Warri',
    updated_at = now()
WHERE code = 'WRI';