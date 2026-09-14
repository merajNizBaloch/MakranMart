update public.makranmart_categories
set
  sort_order = case slug
    when 'balochi-crafts' then 10
    when 'fashion' then 20
    when 'mobiles' then 30
    when 'electronics' then 40
    when 'home-living' then 50
    when 'beauty' then 60
    when 'groceries' then 70
    when 'books' then 80
    when 'sports' then 90
    when 'automotive' then 100
    else sort_order
  end,
  description = case slug
    when 'balochi-crafts' then coalesce(description, 'Handmade embroidery, bags, accessories and craft from Balochistan.')
    when 'fashion' then coalesce(description, 'Clothing, footwear and everyday style from local and national sellers.')
    when 'mobiles' then coalesce(description, 'Phones, charging accessories and mobile essentials.')
    when 'electronics' then coalesce(description, 'Useful electronics, audio products and everyday tech.')
    when 'home-living' then coalesce(description, 'Home essentials, decor and practical products for daily living.')
    when 'beauty' then coalesce(description, 'Personal care, grooming and beauty essentials.')
    when 'groceries' then coalesce(description, 'Food, pantry items and regional products.')
    when 'books' then coalesce(description, 'Books, stationery and learning essentials.')
    when 'sports' then coalesce(description, 'Sports, fitness and outdoor essentials.')
    when 'automotive' then coalesce(description, 'Automotive accessories and practical vehicle essentials.')
    else description
  end,
  updated_at = now()
where slug in (
  'balochi-crafts','fashion','mobiles','electronics','home-living',
  'beauty','groceries','books','sports','automotive'
);
