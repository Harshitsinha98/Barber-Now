-- ============================================================================
-- BarberNow — Initial database schema
-- Run this in Supabase → SQL Editor (or via the Supabase CLI).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('customer', 'barber');
create type service_category as enum ('hair', 'beard', 'shave', 'spa', 'combo', 'kids');
create type price_level as enum ('1', '2', '3');
create type queue_status as enum ('quiet', 'moderate', 'busy');
create type booking_mode as enum ('queue', 'slot');
create type booking_status as enum ('booked', 'in_queue', 'in_service', 'done', 'cancelled', 'no_show');

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user (extends auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'customer',
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- shops — a barbershop, owned by a barber (owner_id -> profiles)
-- ---------------------------------------------------------------------------
create table shops (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references profiles (id) on delete cascade,
  slug         text unique not null,
  name         text not null,
  tagline      text,
  address      text,
  area         text,
  city         text,
  lat          double precision,
  lng          double precision,
  price_level  price_level not null default '2',
  cover_image  text,
  gallery      text[] not null default '{}',
  amenities    text[] not null default '{}',
  open_now     boolean not null default true,
  open_hours   text,
  -- Onboarding gate: only published shops appear to customers
  is_published boolean not null default false,
  -- Live queue snapshot (kept in sync as bookings move through the queue)
  queue_people_ahead   int not null default 0,
  queue_avg_minutes    int not null default 20,
  queue_status         queue_status not null default 'quiet',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index shops_city_idx on shops (city);
create index shops_owner_idx on shops (owner_id);
create index shops_published_idx on shops (is_published);

-- ---------------------------------------------------------------------------
-- services — offered by a shop; barbers manage these themselves
-- ---------------------------------------------------------------------------
create table services (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops (id) on delete cascade,
  name              text not null,
  description       text,
  price             int not null,               -- INR
  duration_minutes  int not null default 30,
  discount_percent  int check (discount_percent between 0 and 90),
  category          service_category not null default 'hair',
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create index services_shop_idx on services (shop_id);

-- ---------------------------------------------------------------------------
-- barbers — staff members within a shop (not necessarily auth users)
-- ---------------------------------------------------------------------------
create table barbers (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops (id) on delete cascade,
  name              text not null,
  avatar_url        text,
  specialities      text[] not null default '{}',
  experience_years  int not null default 0,
  rating            numeric(2,1) not null default 5.0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create index barbers_shop_idx on barbers (shop_id);

-- ---------------------------------------------------------------------------
-- bookings — a customer's booking (queue or slot)
-- ---------------------------------------------------------------------------
create table bookings (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references shops (id) on delete cascade,
  customer_id   uuid references profiles (id) on delete set null,
  barber_id     uuid references barbers (id) on delete set null,
  service_ids   uuid[] not null default '{}',
  mode          booking_mode not null default 'queue',
  slot_time     text,                            -- e.g. "06:30 PM" (for slot mode)
  status        booking_status not null default 'booked',
  queue_position int,                            -- current position when in_queue
  total_amount  int not null default 0,          -- INR snapshot at booking time
  created_at    timestamptz not null default now()
);

create index bookings_shop_idx on bookings (shop_id);
create index bookings_customer_idx on bookings (customer_id);
create index bookings_status_idx on bookings (status);

-- ---------------------------------------------------------------------------
-- reviews — customer reviews for a shop
-- ---------------------------------------------------------------------------
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references shops (id) on delete cascade,
  customer_id  uuid references profiles (id) on delete set null,
  rating       int not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

create index reviews_shop_idx on reviews (shop_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for shops
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shops_touch_updated_at
  before update on shops
  for each row execute function public.touch_updated_at();
