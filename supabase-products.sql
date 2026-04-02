-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────

create table if not exists products (
  id          text primary key,
  name        text not null,
  photo       text not null,
  price_inr   numeric(10,2) not null,
  price_usd   numeric(10,2) not null,
  category    text not null,
  subcategory text,
  sizes       text[] default '{}',
  in_stock    boolean default true,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- Seed all 27 existing products
insert into products (id, name, photo, price_inr, price_usd, category, subcategory, sizes, sort_order) values
  ('mu1','Cotton Dress Shirt',       'catalogue/men/upper/cotton_shirt_men.jpg',           2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],1),
  ('mu2','Cotton Half-Sleeve Shirt', 'catalogue/men/upper/cotton_half_sleeve_shirt.jpg',   2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],2),
  ('mu3','Linen Dress Shirt',        'catalogue/men/upper/linen_shirt_men.jpg',            2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],3),
  ('mu4','Premium White T-Shirt',    'catalogue/men/upper/cotton_white_tshirt.jpg',         799, 9,'men','upper',  array['XS','S','M','L','XL','XXL'],4),
  ('mu5','Relaxed Cotton Shirt',     'catalogue/men/upper/loose_cotton_men%20shirt.jpg',   2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],5),
  ('mu6','Relaxed Linen Shirt',      'catalogue/men/upper/loose_linen_shirt_men.jpg',      2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],6),
  ('mu7','Linen Short-Sleeve Shirt', 'catalogue/men/upper/short_sleeve_lenin_shirt.jpg',   2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],7),
  ('mu8','Linen Short-Sleeve II',    'catalogue/men/upper/short_sleeve_lenin_shirt_2.jpg', 2499,28,'men','upper',  array['XS','S','M','L','XL','XXL'],8),
  ('mb1','Cotton Tailored Trousers', 'catalogue/men/bottom/cotton_pant.jpg',               3399,38,'men','bottom', array['28','30','32','34','36','38'],1),
  ('mb2','Korean Style Trousers',    'catalogue/men/bottom/korean_style_pant.jpg',         3399,38,'men','bottom', array['28','30','32','34','36','38'],2),
  ('mb3','Linen Tailored Trousers',  'catalogue/men/bottom/lenin_pant.jpg',                3399,38,'men','bottom', array['28','30','32','34','36','38'],3),
  ('mb4','Linen Relaxed Chinos',     'catalogue/men/bottom/lenin_pant_style_2.jpg',        3399,38,'men','bottom', array['28','30','32','34','36','38'],4),
  ('wu1','Cotton Classic Shirt',     'catalogue/women/upper/cotton_shirt_style_1.jpg',     2499,28,'women','upper',array['XS','S','M','L','XL'],1),
  ('wu2','Cotton Half-Sleeve Shirt', 'catalogue/women/upper/cotton_half_sleeve_shirt.jpg', 2499,28,'women','upper',array['XS','S','M','L','XL'],2),
  ('wu3','Relaxed Cotton Shirt',     'catalogue/women/upper/cotton_shirt_style_3.jpg',     2499,28,'women','upper',array['XS','S','M','L','XL'],3),
  ('wu4','White Cotton Shirt',       'catalogue/women/upper/cotton_white_shirt_style_2.jpg',2499,28,'women','upper',array['XS','S','M','L','XL'],4),
  ('wu5','Linen Half-Sleeve Shirt',  'catalogue/women/upper/linen_half_sleeve_shirt.jpg',  2499,28,'women','upper',array['XS','S','M','L','XL'],5),
  ('wu6','Linen Classic Shirt',      'catalogue/women/upper/linen_shirt_style_1.jpg',      2499,28,'women','upper',array['XS','S','M','L','XL'],6),
  ('wu7','Premium White T-Shirt',    'catalogue/women/upper/woman_white_tshirt.jpg',        799, 9,'women','upper',array['XS','S','M','L','XL'],7),
  ('wb1','Cotton Tailored Pants',    'catalogue/women/bottom/cotton_pants.jpg',             3399,38,'women','bottom',array['24','26','28','30','32','34'],1),
  ('wb2','Korean Style Pants',       'catalogue/women/bottom/korean_style_cotton_pants.jpg',3399,38,'women','bottom',array['24','26','28','30','32','34'],2),
  ('wb3','Linen Straight Pants',     'catalogue/women/bottom/lenin_pants_style_1.jpg',     3399,38,'women','bottom',array['24','26','28','30','32','34'],3),
  ('wb4','Palazzo Linen Pants',      'catalogue/women/bottom/plazo_lenin_pants.jpg',       3399,38,'women','bottom',array['24','26','28','30','32','34'],4),
  ('tw1','Grand Bath Sheet',         'catalogue/towels/bath_sheets.jpg',                   1250,21.50,'towels',null,array[],1),
  ('tw2','Signature Bath Towel',     'catalogue/towels/bath_towel.jpg',                     850,14.25,'towels',null,array[],2),
  ('tw3','Guest Hand Towel',         'catalogue/towels/hand_towel.jpg',                     275, 4.85,'towels',null,array[],3),
  ('tw4','Facial Washcloth',         'catalogue/towels/facial_wash_cloth.jpg',              110, 1.95,'towels',null,array[],4),
  ('tw5','Sculpted Bath Mat',        'catalogue/towels/bath_mat.jpg',                       450, 7.50,'towels',null,array[],5)
on conflict (id) do nothing;
