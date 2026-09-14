drop policy if exists "makranmart shipping public read" on public.makranmart_shipping_rules;
create policy "makranmart shipping public read"
  on public.makranmart_shipping_rules for select
  to anon, authenticated
  using (is_active);

grant select on table public.makranmart_shipping_rules to anon, authenticated;
grant insert, update, delete on table public.makranmart_shipping_rules to authenticated;

grant select, insert, delete on table public.makranmart_wishlist to authenticated;
