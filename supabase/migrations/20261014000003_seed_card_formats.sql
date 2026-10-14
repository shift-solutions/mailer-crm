-- Seed the two card formats from the spec.
-- Positions (x_in, y_in) are measured from the top-left of each side, in inches,
-- and drive the visual spot board. Adjust in /formats if the print layout differs.

insert into public.card_formats (id, name, width_in, height_in, homes_default, notes) values
  ('9a120000-0000-4000-8000-000000000001', '9x12 Shared', 12, 9, 10000,
   'Front: F1 featured double + F2–F7 singles. Back: B1–B8 singles.'),
  ('6a250000-0000-4000-8000-000000000002', '6.25x11 Community', 11, 6.25, 2500,
   '15 singles plus one house spot. Community cards run 3 months.')
on conflict (id) do nothing;

-- 9x12: front
insert into public.format_spots
  (format_id, code, side, size_label, width_in, height_in, default_price_cents, x_in, y_in, sort_order)
values
  ('9a120000-0000-4000-8000-000000000001','F1','front','Featured double',5.5,3.5,125000,0.4,1.4,1),
  ('9a120000-0000-4000-8000-000000000001','F2','front','Single',2.7,3.5,70000,6.1,1.4,2),
  ('9a120000-0000-4000-8000-000000000001','F3','front','Single',2.7,3.5,70000,9.0,1.4,3),
  ('9a120000-0000-4000-8000-000000000001','F4','front','Single',2.7,3.5,70000,0.4,5.1,4),
  ('9a120000-0000-4000-8000-000000000001','F5','front','Single',2.7,3.5,70000,3.3,5.1,5),
  ('9a120000-0000-4000-8000-000000000001','F6','front','Single',2.7,3.5,70000,6.2,5.1,6),
  ('9a120000-0000-4000-8000-000000000001','F7','front','Single',2.7,3.5,70000,9.1,5.1,7),
-- 9x12: back
  ('9a120000-0000-4000-8000-000000000001','B1','back','Single',2.7,3.4,60000,0.4,0.4,8),
  ('9a120000-0000-4000-8000-000000000001','B2','back','Single',2.7,3.4,60000,3.3,0.4,9),
  ('9a120000-0000-4000-8000-000000000001','B3','back','Single',2.7,3.4,60000,6.2,0.4,10),
  ('9a120000-0000-4000-8000-000000000001','B4','back','Single',2.7,3.4,60000,9.1,0.4,11),
  ('9a120000-0000-4000-8000-000000000001','B5','back','Single',2.7,3.4,60000,0.4,4.0,12),
  ('9a120000-0000-4000-8000-000000000001','B6','back','Single',2.7,3.4,60000,3.3,4.0,13),
  ('9a120000-0000-4000-8000-000000000001','B7','back','Single',2.7,3.4,60000,6.2,4.0,14),
  ('9a120000-0000-4000-8000-000000000001','B8','back','Single',2.7,3.4,60000,9.1,4.0,15)
on conflict (format_id, code) do nothing;

-- 6.25x11 community: C1–C8 on the front, C9–C15 and the house spot on the back
insert into public.format_spots
  (format_id, code, side, size_label, width_in, height_in, default_price_cents, default_status, x_in, y_in, sort_order)
select
  '6a250000-0000-4000-8000-000000000002',
  v.code, v.side, v.size_label, 2.6, 2.5, v.price, v.status,
  (array[0.1, 2.8, 5.5, 8.2])[((v.n - 1) % 4) + 1],
  (array[0.5, 3.15])[(((v.n - 1) % 8) / 4) + 1],
  v.n
from (values
  (1,'C1','front','Single',25000,'open'),
  (2,'C2','front','Single',25000,'open'),
  (3,'C3','front','Single',25000,'open'),
  (4,'C4','front','Single',25000,'open'),
  (5,'C5','front','Single',25000,'open'),
  (6,'C6','front','Single',25000,'open'),
  (7,'C7','front','Single',25000,'open'),
  (8,'C8','front','Single',25000,'open'),
  (9,'C9','back','Single',25000,'open'),
  (10,'C10','back','Single',25000,'open'),
  (11,'C11','back','Single',25000,'open'),
  (12,'C12','back','Single',25000,'open'),
  (13,'C13','back','Single',25000,'open'),
  (14,'C14','back','Single',25000,'open'),
  (15,'C15','back','Single',25000,'open'),
  (16,'H1','back','House',0,'house')
) as v(n, code, side, size_label, price, status)
on conflict (format_id, code) do nothing;
