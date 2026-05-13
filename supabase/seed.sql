insert into public.category (name)
values
  ('Alimentos'),
  ('Ropa'),
  ('Hogar'),
  ('Servicios'),
  ('Otros')
on conflict (name) do nothing;

