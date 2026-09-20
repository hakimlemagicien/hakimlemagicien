-- Keep email-only accounts out of /app until a password exists, including
-- verification links opened on a different device. Replay-safe backfill.
-- OAuth identities remain allowed by the client-side OAuth identity gate.

UPDATE auth.users AS account
SET raw_user_meta_data = COALESCE(account.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'password_set',
    NULLIF(account.encrypted_password, '') IS NOT NULL
  )
WHERE NOT (COALESCE(account.raw_user_meta_data, '{}'::jsonb) ? 'password_set')
;
