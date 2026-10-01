-- ============================================================================
-- BarberNow — Women's & unisex salons
-- Run in Supabase → SQL Editor AFTER 0007. Safe to re-run.
-- ============================================================================

-- Who the salon serves.
alter table shops add column if not exists salon_type text not null default 'men';
alter table shops drop constraint if exists shops_salon_type_chk;
alter table shops add constraint shops_salon_type_chk check (salon_type in ('men', 'women', 'unisex'));

-- Women-staffed salons can highlight it (a common ask from women customers).
alter table shops add column if not exists female_staff boolean not null default false;

create index if not exists shops_salon_type_idx on shops (salon_type);

-- Service categories for women's & unisex menus.
alter type service_category add value if not exists 'colour';
alter type service_category add value if not exists 'skin';
alter type service_category add value if not exists 'nails';
alter type service_category add value if not exists 'waxing';
alter type service_category add value if not exists 'threading';
alter type service_category add value if not exists 'makeup';
