-- =====================================================================
--  002 · Perfil da empresa (logo) e meta por quantidade de peças
-- =====================================================================

-- Logo/foto da empresa, editável pelo dono
alter table public.brands add column if not exists logo_url text;

create policy brands_admin_update on public.brands for update
  using (id = public.my_brand() and public.is_admin())
  with check (id = public.my_brand());

-- Meta do bônus: por quantidade de peças vendidas (padrão) ou por valor vendido
alter table public.profiles add column if not exists goal_type text not null default 'pieces'
  check (goal_type in ('pieces', 'value'));
alter table public.invites add column if not exists goal_type text not null default 'pieces'
  check (goal_type in ('pieces', 'value'));
alter table public.kits add column if not exists goal_type text
  check (goal_type in ('pieces', 'value'));

-- Perfil nasce do convite levando também o tipo de meta
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where lower(email) = lower(new.email);
  if found then
    insert into public.profiles (id, brand_id, role, name, login, commission_pct, bonus_amount, goal_amount, goal_type)
    values (new.id, inv.brand_id, 'reseller', inv.name, inv.login, inv.commission_pct, inv.bonus_amount,
            inv.goal_amount, inv.goal_type);
    delete from public.invites where email = inv.email;
  end if;
  return new;
end $$;

-- Acerto congela também o tipo de meta
create or replace function public.settle_kit(p_kit uuid, p_adjust numeric default 0)
returns void language plpgsql security definer set search_path = public as $$
declare k public.kits; r public.profiles;
begin
  if not public.is_admin() then raise exception 'Apenas o ADM fecha acertos'; end if;
  select * into k from public.kits where id = p_kit and brand_id = public.my_brand() for update;
  if not found or k.status <> 'open' then raise exception 'Maleta não encontrada ou já acertada'; end if;
  select * into r from public.profiles where id = k.reseller_id;

  update public.kit_items ki set price = p.price
    from public.pieces p where ki.kit_id = p_kit and p.id = ki.piece_id;

  update public.pieces p set stock_qty = p.stock_qty + x.qtd
    from (select piece_id, count(*) qtd from public.kit_items
           where kit_id = p_kit and not sold group by piece_id) x
   where p.id = x.piece_id;

  update public.kits set status = 'settled', settled_at = now(),
         commission_pct = r.commission_pct, bonus_amount = r.bonus_amount,
         goal_amount = r.goal_amount, goal_type = r.goal_type,
         adjust_amount = coalesce(p_adjust, 0)
   where id = p_kit;
end $$;
