-- ============================================================================
-- BarberNow — Storage bucket for shop & service photos
-- Run AFTER 0002_rls_policies.sql
-- ============================================================================

-- Public bucket so customers can view shop photos without auth.
insert into storage.buckets (id, name, public)
values ('shop-photos', 'shop-photos', true)
on conflict (id) do nothing;

-- Anyone can view photos (public bucket read).
create policy "shop-photos: public read"
  on storage.objects for select
  using (bucket_id = 'shop-photos');

-- Authenticated users (barbers) can upload into the bucket.
-- Convention: files are stored under "<shop_id>/<filename>".
create policy "shop-photos: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shop-photos');

-- Uploaders can update / delete their own uploaded objects.
create policy "shop-photos: owner update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shop-photos' and owner = auth.uid());

create policy "shop-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shop-photos' and owner = auth.uid());
