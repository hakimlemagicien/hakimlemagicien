-- Production drift reconciliation for provider-originated payments.
--
-- apply_provider_subscription_event writes method = 'other'. Historical source
-- migrations include this value, but the live enum currently has only stripe,
-- bank_transfer, and cash. Restore the contract idempotently before enabling
-- payment-provider webhooks.

ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'other';
