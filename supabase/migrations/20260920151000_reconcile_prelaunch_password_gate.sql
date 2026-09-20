-- The canonical pre-launch customer verified by email before the durable
-- password gate shipped. Force exactly this preserved test account through
-- Create Password once; admin/staff accounts and all other users are untouched.

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('password_set', false)
WHERE id = 'd12a89a0-8d1d-40bc-b9ee-2c6aa0e89d9d'::uuid
  AND lower(email) = 'fitmaak@gmail.com'
  AND COALESCE(raw_app_meta_data -> 'providers', '[]'::jsonb) @> '["email"]'::jsonb;
