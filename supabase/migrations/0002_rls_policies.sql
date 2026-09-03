-- ============================================================================
-- BarberNow — Row Level Security (RLS) policies
-- Run AFTER 0001_initial_schema.sql
-- ============================================================================

-- Enable RLS on every table
alter table profiles enable row level security;
alter table shops    enable row level security;
alter table services enable row level security;
alter table barbers  enable row level security;
alter table bookings enable row level security;
alter table reviews  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- A user can read & update only their own profile.
create policy "profiles: read own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------
-- Anyone (even logged-out customers) can read PUBLISHED shops.
create policy "shops: public reads published"
  on shops for select
  using (is_published = true);

-- Owners can read all their own shops (including unpublished drafts).
create policy "shops: owner reads own"
  on shops for select
  using (auth.uid() = owner_id);

-- Owners can create a shop for themselves.
create policy "shops: owner inserts own"
  on shops for insert
  with check (auth.uid() = owner_id);

-- Owners can update / delete only their own shops.
create policy "shops: owner updates own"
  on shops for update
  using (auth.uid() = owner_id);

create policy "shops: owner deletes own"
  on shops for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Helper: is the current user the owner of a given shop?
-- ---------------------------------------------------------------------------
create or replace function public.owns_shop(target_shop uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from shops s
    where s.id = target_shop and s.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- services  (public reads active services of published shops; owner manages)
-- ---------------------------------------------------------------------------
create policy "services: public reads active"
  on services for select
  using (
    is_active = true
    and exists (
      select 1 from shops s
      where s.id = services.shop_id and s.is_published = true
    )
  );

create policy "services: owner reads own"
  on services for select
  using (public.owns_shop(shop_id));

create policy "services: owner writes own"
  on services for all
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

-- ---------------------------------------------------------------------------
-- barbers  (public reads active barbers of published shops; owner manages)
-- ---------------------------------------------------------------------------
create policy "barbers: public reads active"
  on barbers for select
  using (
    is_active = true
    and exists (
      select 1 from shops s
      where s.id = barbers.shop_id and s.is_published = true
    )
  );

create policy "barbers: owner reads own"
  on barbers for select
  using (public.owns_shop(shop_id));

create policy "barbers: owner writes own"
  on barbers for all
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
-- Customer sees their own bookings.
create policy "bookings: customer reads own"
  on bookings for select
  using (auth.uid() = customer_id);

-- Shop owner sees bookings for their shop (to manage the queue).
create policy "bookings: owner reads shop"
  on bookings for select
  using (public.owns_shop(shop_id));

-- A logged-in customer can create a booking for themselves.
create policy "bookings: customer inserts own"
  on bookings for insert
  with check (auth.uid() = customer_id);

-- Customer can update (e.g. cancel) their own booking.
create policy "bookings: customer updates own"
  on bookings for update
  using (auth.uid() = customer_id);

-- Shop owner can update bookings for their shop (advance the queue).
create policy "bookings: owner updates shop"
  on bookings for update
  using (public.owns_shop(shop_id));

-- ---------------------------------------------------------------------------
-- reviews  (public reads; logged-in customer writes own)
-- ---------------------------------------------------------------------------
create policy "reviews: public reads"
  on reviews for select
  using (true);

create policy "reviews: customer inserts own"
  on reviews for insert
  with check (auth.uid() = customer_id);

create policy "reviews: customer updates own"
  on reviews for update
  using (auth.uid() = customer_id);

-- ---------------------------------------------------------------------------
-- Realtime — broadcast queue / booking changes to subscribed clients
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table shops;
alter publication supabase_realtime add table bookings;
