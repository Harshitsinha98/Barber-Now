-- ============================================================================
-- BarberNow — Partner program: onboarding review, ₹1499/month subscription,
-- paid boosts, ad stats. Run in Supabase → SQL Editor AFTER 0001–0006.
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Onboarding + subscription columns on shops
-- ---------------------------------------------------------------------------
alter table shops add column if not exists onboarding_status text not null default 'draft';
alter table shops drop constraint if exists shops_onboarding_status_chk;
alter table shops add constraint shops_onboarding_status_chk
  check (onboarding_status in ('draft', 'submitted', 'approved', 'rejected'));

alter table shops add column if not exists owner_name         text;
alter table shops add column if not exists pincode            text;
alter table shops add column if not exists pan_number         text;
alter table shops add column if not exists gstin              text;
alter table shops add column if not exists kyc_doc_path       text;
alter table shops add column if not exists rejection_reason   text;
alter table shops add column if not exists submitted_at       timestamptz;
alter table shops add column if not exists approved_at        timestamptz;
alter table shops add column if not exists subscription_until timestamptz;
alter table shops add column if not exists boost_until        timestamptz;

create index if not exists shops_onboarding_idx on shops (onboarding_status);

-- Shops that were already live before this program: approve them and give a
-- 30-day launch grace period so they don't vanish overnight.
update shops
set onboarding_status = 'approved',
    approved_at = coalesce(approved_at, now()),
    subscription_until = greatest(coalesce(subscription_until, now()), now() + interval '30 days')
where is_published = true and onboarding_status = 'draft';

-- Barbers must not be able to approve themselves, extend their own
-- subscription/boost, or (un)verify/suspend. Only the service role may.
create or replace function public.guard_shop_admin_flags()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.is_verified        := old.is_verified;
    new.is_suspended       := old.is_suspended;
    new.onboarding_status  := old.onboarding_status;
    new.rejection_reason   := old.rejection_reason;
    new.submitted_at       := old.submitted_at;
    new.approved_at        := old.approved_at;
    new.subscription_until := old.subscription_until;
    new.boost_until        := old.boost_until;
  end if;
  return new;
end;
$$;

drop trigger if exists shops_guard_admin_flags on shops;
create trigger shops_guard_admin_flags
  before update on shops
  for each row execute function public.guard_shop_admin_flags();

-- New shops always start as a draft, whoever inserts them.
create or replace function public.guard_shop_insert()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.onboarding_status  := 'draft';
    new.is_verified        := false;
    new.is_suspended       := false;
    new.subscription_until := null;
    new.boost_until        := null;
    new.approved_at        := null;
  end if;
  return new;
end;
$$;

drop trigger if exists shops_guard_insert on shops;
create trigger shops_guard_insert
  before insert on shops
  for each row execute function public.guard_shop_insert();

-- ---------------------------------------------------------------------------
-- 2. "Live" = published + approved + paid + not suspended
-- ---------------------------------------------------------------------------
drop policy if exists "shops: public reads published" on shops;
create policy "shops: public reads published"
  on shops for select using (
    is_published and not is_suspended
    and onboarding_status = 'approved'
    and subscription_until > now()
  );

drop policy if exists "services: public reads active" on services;
create policy "services: public reads active"
  on services for select using (
    is_active and exists (
      select 1 from shops s
      where s.id = services.shop_id and s.is_published and not s.is_suspended
        and s.onboarding_status = 'approved' and s.subscription_until > now()
    )
  );

drop policy if exists "barbers: public reads active" on barbers;
create policy "barbers: public reads active"
  on barbers for select using (
    is_active and exists (
      select 1 from shops s
      where s.id = barbers.shop_id and s.is_published and not s.is_suspended
        and s.onboarding_status = 'approved' and s.subscription_until > now()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Payments (subscription + boosts). Written only by the server (service
--    role); owners can read their own history.
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  shop_id             uuid not null references shops (id) on delete cascade,
  kind                text not null check (kind in ('subscription', 'boost')),
  plan_code           text not null,
  amount              int  not null,               -- INR
  days                int  not null,
  status              text not null default 'created' check (status in ('created', 'paid', 'failed')),
  method              text not null default 'razorpay' check (method in ('razorpay', 'manual')),
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  period_start        timestamptz,
  period_end          timestamptz,
  note                text,
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);
create index if not exists payments_shop_idx on payments (shop_id, created_at desc);

alter table payments enable row level security;
drop policy if exists "payments: owner reads own" on payments;
create policy "payments: owner reads own"
  on payments for select using (public.owns_shop(shop_id));

-- ---------------------------------------------------------------------------
-- 4. Ad stats (impressions / clicks / app bookings per day)
-- ---------------------------------------------------------------------------
create table if not exists shop_stats_daily (
  shop_id     uuid not null references shops (id) on delete cascade,
  day         date not null default public.ist_today(),
  impressions int  not null default 0,
  clicks      int  not null default 0,
  bookings    int  not null default 0,
  primary key (shop_id, day)
);

alter table shop_stats_daily enable row level security;
drop policy if exists "stats: owner reads own" on shop_stats_daily;
create policy "stats: owner reads own"
  on shop_stats_daily for select using (public.owns_shop(shop_id));

create or replace function public.track_shop_event(p_shop uuid, p_event text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_event not in ('impression', 'click') then return; end if;
  if not exists (select 1 from shops where id = p_shop) then return; end if;
  insert into shop_stats_daily (shop_id, day, impressions, clicks)
  values (p_shop, public.ist_today(),
          (p_event = 'impression')::int, (p_event = 'click')::int)
  on conflict (shop_id, day) do update
    set impressions = shop_stats_daily.impressions + excluded.impressions,
        clicks      = shop_stats_daily.clicks + excluded.clicks;
end;
$$;
grant execute on function public.track_shop_event(uuid, text) to anon, authenticated;

create or replace function public.bookings_stats_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.customer_id is not null then
    insert into shop_stats_daily (shop_id, day, bookings)
    values (new.shop_id, public.ist_today(), 1)
    on conflict (shop_id, day) do update
      set bookings = shop_stats_daily.bookings + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_stats_sync on bookings;
create trigger bookings_stats_sync
  after insert on bookings
  for each row execute function public.bookings_stats_sync();

-- ---------------------------------------------------------------------------
-- 5. Private bucket for KYC documents (owner folder = auth.uid()).
--    Admins read them through short-lived signed URLs (service role).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyc-docs', 'kyc-docs', false)
on conflict (id) do nothing;

drop policy if exists "kyc-docs: owner upload" on storage.objects;
create policy "kyc-docs: owner upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'kyc-docs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "kyc-docs: owner read" on storage.objects;
create policy "kyc-docs: owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'kyc-docs' and (storage.foldername(name))[1] = auth.uid()::text);
