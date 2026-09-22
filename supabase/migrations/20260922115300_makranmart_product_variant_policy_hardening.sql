drop policy if exists "makranmart variants public read" on public.makranmart_product_variants;
drop policy if exists "makranmart admin variants all" on public.makranmart_product_variants;

create policy "makranmart variants anon read"
  on public.makranmart_product_variants for select
  to anon
  using (
    is_active
    and exists (
      select 1
      from public.makranmart_products product
      where product.id = makranmart_product_variants.product_id
        and product.is_active = true
    )
  );

create policy "makranmart variants authenticated read"
  on public.makranmart_product_variants for select
  to authenticated
  using (
    (
      is_active
      and exists (
        select 1
        from public.makranmart_products product
        where product.id = makranmart_product_variants.product_id
          and product.is_active = true
      )
    )
    or makranmart_private.is_admin()
  );

create policy "makranmart admin variants insert"
  on public.makranmart_product_variants for insert
  to authenticated
  with check (makranmart_private.is_admin());

create policy "makranmart admin variants update"
  on public.makranmart_product_variants for update
  to authenticated
  using (makranmart_private.is_admin())
  with check (makranmart_private.is_admin());

create policy "makranmart admin variants delete"
  on public.makranmart_product_variants for delete
  to authenticated
  using (makranmart_private.is_admin());
