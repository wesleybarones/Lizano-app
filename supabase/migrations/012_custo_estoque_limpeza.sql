-- =====================================================================
--  012 · Custo só para o dono, estoque nunca negativo e limpeza
--
--  ORDEM: rode esta migration e, logo em seguida, publique o app novo
--  (branch untangle/regras-datas-marca). Entre uma coisa e outra, o app
--  antigo não consegue SALVAR peças (a coluna de custo muda de lugar);
--  ver listas, maletas e vendas continua funcionando.
--
--  1. Custo da peça vai para a tabela piece_costs, que só o dono lê.
--     Antes, a revendedora conseguia ler a coluna pieces.cost direto
--     no Supabase (a regra de acesso liberava a linha inteira).
--  2. Estoque não pode ficar negativo (montar maleta sem estoque falha).
--  3. Tirar peça VENDIDA de maleta aberta não devolve ao estoque.
--     Com isso, excluir maleta não precisa mais do truque de marcar
--     como acertada antes de apagar.
--  4. Remove os convites (substituídos por create_reseller na 007).
--  5. O dono pode apagar fotos de peças da marca dele (Storage).
-- =====================================================================

-- Antes de rodar, veja se há peça com estoque negativo (serão zeradas no passo 2):
--   select code, name, stock_qty from public.pieces where stock_qty < 0;

begin;

-- ---------- 1. Custo só para o dono ----------
create table public.piece_costs (
  piece_id uuid primary key references public.pieces (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  cost numeric(12,2) not null default 0
);

insert into public.piece_costs (piece_id, brand_id, cost)
select id, brand_id, cost from public.pieces;

alter table public.piece_costs enable row level security;
create policy piece_costs_admin on public.piece_costs for all
  using (public.is_admin() and brand_id = public.my_brand())
  with check (public.is_admin() and brand_id = public.my_brand());

alter table public.pieces drop column cost;

-- ---------- 2. Estoque nunca negativo ----------
update public.pieces set stock_qty = 0 where stock_qty < 0;
alter table public.pieces add constraint pieces_stock_nonneg check (stock_qty >= 0);

-- ---------- 3. Peça vendida não volta ao estoque ----------
create or replace function public.kit_items_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.pieces set stock_qty = stock_qty - 1 where id = new.piece_id;
    return new;
  elsif tg_op = 'DELETE' then
    -- só volta ao estoque o que estava com a revendedora (maleta aberta e não vendida)
    if not old.sold and (select status from public.kits where id = old.kit_id) = 'open' then
      update public.pieces set stock_qty = stock_qty + 1 where id = old.piece_id;
    end if;
    return old;
  end if;
  return null;
end $$;

-- Maleta aberta: o gatilho acima devolve ao estoque as peças não vendidas.
-- Maleta acertada: o estoque já foi acertado no fechamento.
create or replace function public.delete_kit(p_kit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.kits;
begin
  if not public.is_admin() then raise exception 'Apenas o ADM exclui maletas'; end if;
  select * into k from public.kits where id = p_kit and brand_id = public.my_brand() for update;
  if not found then raise exception 'Maleta não encontrada'; end if;
  delete from public.kit_items where kit_id = p_kit;
  delete from public.kits where id = p_kit;
end $$;

-- ---------- 4. Fim dos convites ----------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.invites;

-- ---------- 5. Dono apaga fotos da própria marca ----------
-- (apagar no Storage exige também poder ler o registro do arquivo)
create policy pecas_select on storage.objects for select to authenticated
  using (bucket_id = 'pecas' and public.is_admin()
         and (storage.foldername(name))[1] = public.my_brand()::text);
create policy pecas_delete on storage.objects for delete to authenticated
  using (bucket_id = 'pecas' and public.is_admin()
         and (storage.foldername(name))[1] = public.my_brand()::text);

commit;
