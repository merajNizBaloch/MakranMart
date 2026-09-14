update public.makranmart_sellers
set description = case slug
  when 'makran-craft-house' then coalesce(description, 'Traditional craft and handmade accessories inspired by Makran and Balochi design.')
  when 'digital-hub' then coalesce(description, 'Everyday electronics, audio and useful technology products.')
  when 'sahil-wear' then coalesce(description, 'Comfortable everyday clothing and contemporary fashion from Gwadar.')
  when 'ghar-studio' then coalesce(description, 'Simple home, lighting and living products for modern spaces.')
  when 'panjgur-handmade' then coalesce(description, 'Handmade embroidered pieces and locally crafted accessories from Panjgur.')
  when 'makran-mobile-center' then coalesce(description, 'Mobile accessories, charging products and practical phone essentials.')
  when 'active-pakistan' then coalesce(description, 'Sports, fitness and everyday activewear products.')
  when 'makran-foods' then coalesce(description, 'Regional food products and carefully selected pantry essentials from Makran.')
  else description
end,
updated_at = now()
where slug in (
  'makran-craft-house','digital-hub','sahil-wear','ghar-studio',
  'panjgur-handmade','makran-mobile-center','active-pakistan','makran-foods'
);
