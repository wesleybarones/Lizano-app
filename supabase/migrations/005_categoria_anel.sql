-- 005 · Categoria "anel"
alter table public.pieces drop constraint if exists pieces_category_check;
alter table public.pieces add constraint pieces_category_check
  check (category in ('brinco', 'colar', 'pulseira', 'anel', 'outro'));
update public.pieces set category = 'anel'
 where category = 'outro' and (name ilike '%anel%' or name ilike '%aneis%' or name ilike '%anéis%');
