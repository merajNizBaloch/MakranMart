-- Guest checkout remains public; administrative RPCs require authentication
-- and retain their existing per-call admin/ownership checks.
revoke execute on function public.makranmart_admin_sales_analytics() from public, anon;
grant execute on function public.makranmart_admin_sales_analytics() to authenticated;
revoke execute on function public.makranmart_my_order_events(uuid) from public, anon;
grant execute on function public.makranmart_my_order_events(uuid) to authenticated;
revoke execute on function public.makranmart_update_order_status(uuid,text,text,boolean) from public, anon;
grant execute on function public.makranmart_update_order_status(uuid,text,text,boolean) to authenticated;
update public.makranmart_categories set description = 'Clothing, footwear and everyday style, selected by MakranMart.' where slug = 'fashion';
