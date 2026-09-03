-- ============================================================================
-- BarberNow — OTP verifications table (multi-channel: WhatsApp / SMS / Voice)
-- Run in Supabase → SQL Editor.
--
-- Only the SHA-256 (peppered) HASH of the code is ever stored — never the
-- plaintext OTP. Rate-limit + attempt fields prevent spam / brute-force.
-- All access is server-side only (service role), so RLS denies everything
-- to anon/authenticated clients.
-- ============================================================================

create table if not exists otp_verifications (
  -- E.164 phone number is the primary key (one active OTP per number).
  phone             text primary key,
  code_hash         text not null,
  expires_at_ms     bigint not null,
  attempts          int not null default 0,
  last_sent_at_ms   bigint not null default 0,
  -- Rolling window of send timestamps (ms) for the per-window send cap.
  send_timestamps   bigint[] not null default '{}',
  last_channel      text,
  verified          boolean not null default false,
  verified_at_ms    bigint,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Keep updated_at fresh (reuses touch_updated_at() from 0001).
create trigger otp_touch_updated_at
  before update on otp_verifications
  for each row execute function public.touch_updated_at();

-- Lock the table down: enable RLS with NO policies, so only the server-side
-- service role (which bypasses RLS) can read/write OTP rows. The publishable
-- (anon) key and logged-in users get zero access.
alter table otp_verifications enable row level security;
