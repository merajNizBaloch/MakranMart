revoke all on table public.makranmart_profiles from anon;
revoke insert, update, delete on table public.makranmart_profiles from authenticated;

grant select on table public.makranmart_profiles to authenticated;
grant insert (id, full_name, phone, created_at, updated_at)
  on table public.makranmart_profiles to authenticated;
grant update (full_name, phone, updated_at)
  on table public.makranmart_profiles to authenticated;
