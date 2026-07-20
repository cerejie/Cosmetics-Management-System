-- Optional development seed data.
-- Run after creating at least one auth user.

insert into public.categories (name, description) values
  ('Skincare', 'Cleansers, serums, moisturisers and treatments'),
  ('Makeup', 'Face, eye and lip colour products'),
  ('Haircare', 'Shampoos, conditioners and styling'),
  ('Fragrance', 'Perfumes and body mists')
on conflict (name) do nothing;

insert into public.products (sku, name, brand, category_id, cost_price, unit_price, stock_quantity, reorder_level)
select v.sku, v.name, v.brand, c.id, v.cost_price, v.unit_price, v.stock_quantity, v.reorder_level
from (values
  ('SKN-001', 'Hydrating Facial Cleanser 150ml', 'Aurea', 'Skincare', 180.00, 349.00, 42, 10),
  ('SKN-002', 'Vitamin C Brightening Serum 30ml', 'Aurea', 'Skincare', 420.00, 899.00, 18, 8),
  ('SKN-003', 'Niacinamide Oil Control Toner', 'Lumen', 'Skincare', 210.00, 449.00, 6, 10),
  ('MKP-001', 'Matte Liquid Lipstick — Rosewood', 'Velvet Co', 'Makeup', 120.00, 299.00, 60, 15),
  ('MKP-002', 'Full Coverage Foundation — Beige', 'Velvet Co', 'Makeup', 340.00, 749.00, 24, 10),
  ('MKP-003', 'Everyday Eyeshadow Palette', 'Velvet Co', 'Makeup', 480.00, 1099.00, 9, 6),
  ('HAI-001', 'Argan Repair Shampoo 400ml', 'Botanica', 'Haircare', 195.00, 429.00, 33, 12),
  ('HAI-002', 'Keratin Smoothing Conditioner', 'Botanica', 'Haircare', 205.00, 449.00, 4, 12),
  ('FRG-001', 'Eau de Parfum — Jasmine Noir 50ml', 'Maison EJ', 'Fragrance', 890.00, 1999.00, 12, 5)
) as v (sku, name, brand, category_name, cost_price, unit_price, stock_quantity, reorder_level)
join public.categories c on c.name = v.category_name
on conflict (sku) do nothing;
