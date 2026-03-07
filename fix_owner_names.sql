-- Fix missing owner_name and owner_phone in stores table
UPDATE stores s
SET 
  owner_name = COALESCE(s.owner_name, u.name, 'غير معروف'),
  owner_phone = COALESCE(s.owner_phone, u.phone, '')
FROM users u
WHERE s.owner_id = u.id;

-- Verify the update
SELECT id, store_name, owner_name, owner_phone, owner_id FROM stores;
