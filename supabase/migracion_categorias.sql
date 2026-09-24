-- ============================================================
-- VÍA LÁCTEA — Migración: categorías dinámicas
-- Corré esto en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1) Tabla de categorías
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  icono text not null default '📦',
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Cargar las 9 categorías actuales (no pisa si ya existen)
insert into public.categorias (slug, nombre, icono, orden) values
  ('quesos',     'Quesos',     '🧀', 10),
  ('fiambres',   'Fiambres',   '🥩', 20),
  ('lacteos',    'Lácteos',    '🥛', 30),
  ('dulces',     'Dulces',     '🍯', 40),
  ('aceitunas',  'Aceitunas',  '🫒', 50),
  ('copetin',    'Copetín',    '🍿', 60),
  ('congelados', 'Congelados', '❄️', 70),
  ('pastas',     'Pastas',     '🍝', 80),
  ('aderezos',   'Aderezos',   '🫙', 90)
on conflict (slug) do nothing;

-- 3) RLS: lectura pública (así el catálogo puede leerlas)
alter table public.categorias enable row level security;

drop policy if exists "categorias_lectura_publica" on public.categorias;
create policy "categorias_lectura_publica"
  on public.categorias for select
  using (true);

-- 4) RLS: solo administradores pueden crear/editar/borrar
drop policy if exists "categorias_admin_escritura" on public.categorias;
create policy "categorias_admin_escritura"
  on public.categorias for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );