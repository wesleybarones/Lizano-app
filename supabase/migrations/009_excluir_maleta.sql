-- =====================================================================
--  009 · Excluir maleta (só o dono)
--  Maleta na rua: peças não vendidas voltam ao estoque.
--  Maleta acertada: o estoque já foi acertado; só apaga o registro.
-- =====================================================================
create or replace function public.delete_kit(p_kit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare k public.kits;
begin
  if not public.is_admin() then raise exception 'Apenas o ADM exclui maletas'; end if;
  select * into k from public.kits where id = p_kit and brand_id = public.my_brand() for update;
  if not found then raise exception 'Maleta não encontrada'; end if;

  if k.status = 'open' then
    update public.pieces p set stock_qty = p.stock_qty + x.qtd
      from (select piece_id, count(*) qtd from public.kit_items
             where kit_id = p_kit and not sold group by piece_id) x
     where p.id = x.piece_id;
    -- marca como acertada antes de apagar, para o gatilho de estoque não devolver de novo
    update public.kits set status = 'settled' where id = p_kit;
  end if;

  delete from public.kit_items where kit_id = p_kit;
  delete from public.kits where id = p_kit;
end $$;

revoke all on function public.delete_kit(uuid) from public;
grant execute on function public.delete_kit(uuid) to authenticated;
