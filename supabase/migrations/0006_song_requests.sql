-- ============================================================================
-- BarberNow — Song requests
-- Customers can request a song to be played while they're in the chair.
-- Run in Supabase → SQL Editor AFTER 0005. Safe to re-run.
-- ============================================================================

-- Shops can opt out (some prefer to control their own music).
alter table shops add column if not exists accepts_song_requests boolean not null default true;

-- The request itself, stored on the booking. Short, plain text.
alter table bookings add column if not exists song_request text;

alter table bookings drop constraint if exists bookings_song_request_len;
alter table bookings add constraint bookings_song_request_len
  check (song_request is null or char_length(song_request) <= 100);
