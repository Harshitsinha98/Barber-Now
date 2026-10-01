-- ============================================================================
-- BarberNow — Panels upgrade (customer / barber / admin)
-- Run in Supabase → SQL Editor AFTER 0001–0004. Safe to re-run.
-- ============================================================================

-- India "today" (Supabase runs in UTC; IST is UTC+5:30).
create or replace function public.ist_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

-- ---------------------------------------------------------------------------
-- shops: admin-controlled flags
-- ---------------------------------------------------------------------------
alter table shops add column if not exists is_verified  boolean not null default false;
alter table shops add column if not exists is_suspended boolean not null default false;

-- Barbers must not be able to verify / un-suspend their own shop. Only the
-- service role (used by the admin panel on the server) may change these.
create or replace function public.guard_shop_admin_flags()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.is_verified  := old.is_verified;
    new.is_suspended := old.is_suspended;
  end if;
  return new;
end;
$$;

drop trigger if exists shops_guard_admin_flags on shops;
create trigger shops_guard_admin_flags
  before update on shops
  for each row execute function public.guard_shop_admin_flags();

-- Suspended shops disappear from the public site.
drop policy if exists "shops: public reads published" on shops;
create policy "shops: public reads published"
  on shops for select using (is_published = true and is_suspended = false);

drop policy if exists "services: public reads active" on services;
create policy "services: public reads active"
  on services for select using (
    is_active = true and exists (
      select 1 from shops s
      where s.id = services.shop_id and s.is_published and not s.is_suspended
    )
  );

drop policy if exists "barbers: public reads active" on barbers;
create policy "barbers: public reads active"
  on barbers for select using (
    is_active = true and exists (
      select 1 from shops s
      where s.id = barbers.shop_id and s.is_published and not s.is_suspended
    )
  );

-- ---------------------------------------------------------------------------
-- bookings: customer snapshot, walk-ins, date
-- ---------------------------------------------------------------------------
alter table bookings add column if not exists customer_name  text;
alter table bookings add column if not exists customer_phone text;
alter table bookings add column if not exists booking_date   date not null default public.ist_today();
alter table bookings add column if not exists updated_at     timestamptz not null default now();

drop trigger if exists bookings_touch_updated_at on bookings;
create trigger bookings_touch_updated_at
  before update on bookings
  for each row execute function public.touch_updated_at();

create index if not exists bookings_shop_date_idx on bookings (shop_id, booking_date);

-- One active booking per slot per barber ("any" barber counts as its own lane).
drop index if exists bookings_slot_unique;
create unique index bookings_slot_unique
  on bookings (shop_id, booking_date, slot_time, coalesce(barber_id::text, 'any'))
  where mode = 'slot' and status in ('booked', 'in_queue', 'in_service');

-- Barbers can add walk-in customers to their own queue.
drop policy if exists "bookings: owner inserts shop" on bookings;
create policy "bookings: owner inserts shop"
  on bookings for insert with check (public.owns_shop(shop_id));

-- ---------------------------------------------------------------------------
-- Live queue snapshot — kept in sync by a trigger (works for customers too,
-- who can't update shops or see other people's bookings under RLS).
-- ---------------------------------------------------------------------------
create or replace function public.refresh_shop_queue(p_shop uuid)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n
  from bookings
  where shop_id = p_shop
    and booking_date = public.ist_today()
    and status in ('booked', 'in_queue', 'in_service');

  update shops
  set queue_people_ahead = n,
      queue_status = case
        when n = 0 then 'quiet'::queue_status
        when n <= 3 then 'moderate'::queue_status
        else 'busy'::queue_status
      end
  where id = p_shop;
end;
$$;

create or replace function public.bookings_queue_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_shop_queue(old.shop_id);
    return old;
  end if;
  perform public.refresh_shop_queue(new.shop_id);
  if tg_op = 'UPDATE' and old.shop_id <> new.shop_id then
    perform public.refresh_shop_queue(old.shop_id);
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_queue_sync on bookings;
create trigger bookings_queue_sync
  after insert or update or delete on bookings
  for each row execute function public.bookings_queue_sync();

-- How many active bookings are ahead of MY booking (0 if not mine / not active).
create or replace function public.my_queue_position(p_booking uuid)
returns int language sql security definer set search_path = public stable as $$
  select count(*)::int
  from bookings me
  join bookings b
    on b.shop_id = me.shop_id
   and b.booking_date = me.booking_date
   and b.status in ('booked', 'in_queue', 'in_service')
   and b.created_at < me.created_at
  where me.id = p_booking
    and me.customer_id = auth.uid()
    and me.status in ('booked', 'in_queue');
$$;

-- Slot times already taken today at a shop (for the booking widget).
create or replace function public.taken_slots(p_shop uuid)
returns text[] language sql security definer set search_path = public stable as $$
  select coalesce(array_agg(slot_time), '{}')
  from bookings
  where shop_id = p_shop
    and mode = 'slot'
    and booking_date = public.ist_today()
    and slot_time is not null
    and status in ('booked', 'in_queue', 'in_service');
$$;

grant execute on function public.my_queue_position(uuid) to authenticated;
grant execute on function public.taken_slots(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- reviews: tie to a completed booking + store the display name
-- (customers can't read other people's profiles under RLS).
-- ---------------------------------------------------------------------------
alter table reviews add column if not exists booking_id    uuid references bookings (id) on delete set null;
alter table reviews add column if not exists reviewer_name text;
create unique index if not exists reviews_booking_unique
  on reviews (booking_id) where booking_id is not null;

-- Recompute today's snapshot for every shop once (picks up the new date rule).
select public.refresh_shop_queue(id) from shops;
