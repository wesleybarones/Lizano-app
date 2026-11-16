-- =====================================================================
--  004 · Categoria das peças (brinco, colar, pulseira, outro)
-- =====================================================================
alter table public.pieces add column if not exists category text not null default 'outro'
  check (category in ('brinco', 'colar', 'pulseira', 'outro'));

-- Peças já cadastradas: classifica pelo nome
update public.pieces set category = case
  when name ilike '%brinco%' then 'brinco'
  when name ilike '%colar%' or name ilike '%gargantilha%' or name ilike '%corrente%' then 'colar'
  when name ilike '%pulseira%' or name ilike '%bracelete%' then 'pulseira'
  else 'outro' end
where category = 'outro';

create index if not exists pieces_category on public.pieces (brand_id, category);
