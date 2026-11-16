-- =====================================================================
--  006 · Excluir peça
--  - Peça que nunca entrou em maleta: apagada de vez.
--  - Peça com histórico de maletas: arquivada (some das listas, mas os
--    acertos antigos continuam com o nome e o preço certos).
--  - Peça numa maleta na rua sem ter sido vendida: não pode ser excluída.
-- =====================================================================
alter table public.pieces add column if not exists archived boolean not null default false;

create or replace function public.delete_piece(p_piece uuid) returns text
language plpgsql security definer set search_path = public as $$
declare pc public.pieces;
begin
  if not public.is_admin() then raise exception 'Apenas o ADM exclui peças'; end if;
  select * into pc from public.pieces where id = p_piece and brand_id = public.my_brand();
  if not found then raise exception 'Peça não encontrada'; end if;

  if exists (select 1 from public.kit_items ki join public.kits k on k.id = ki.kit_id
              where ki.piece_id = p_piece and k.status = 'open' and not ki.sold) then
    raise exception 'Esta peça está numa maleta na rua. Tire da maleta antes de excluir.';
  end if;

  if exists (select 1 from public.kit_items where piece_id = p_piece) then
    update public.pieces set archived = true where id = p_piece;
    return 'archived';
  end if;

  delete from public.pieces where id = p_piece;
  return 'deleted';
end $$;

revoke all on function public.delete_piece(uuid) from public;
grant execute on function public.delete_piece(uuid) to authenticated;
