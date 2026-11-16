-- 011 · Estoque mínimo por peça (aviso de reposição)
alter table public.pieces add column if not exists min_stock integer not null default 2 check (min_stock >= 0);
