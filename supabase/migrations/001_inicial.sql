-- =====================================================================
--  Barones Labs · Sistema de consignado
--  Estrutura inicial do banco (rodar uma vez no SQL Editor do Supabase)
--
--  Regras de acesso (Row Level Security):
--   - Cada marca (brand) só enxerga os próprios dados.
--   - ADM (dono) lê e altera tudo da marca dele.
--   - Revendedora só lê a própria maleta e as peças dela, e só marca
--     vendas pela função mark_sold (não altera preço, comissão nem bônus).
--  O sistema NÃO movimenta dinheiro: só registra e calcula.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tabelas ----------

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  role text not null check (role in ('admin', 'reseller')),
  name text not null,
  login text,                                 -- celular ou e-mail mostrado no painel
  commission_pct numeric(5,2) not null default 30,   -- % sobre o vendido
  bonus_amount numeric(12,2) not null default 0,     -- R$ ao bater a meta
  goal_amount numeric(12,2) not null default 0,      -- meta de venda por maleta
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Convites: o ADM cadastra a revendedora; quando a conta de login dela é
-- criada com o mesmo e-mail, o perfil nasce sozinho a partir do convite.
create table public.invites (
  email text primary key,
  brand_id uuid not null references public.brands (id) on delete cascade,
  name text not null,
  login text,
  commission_pct numeric(5,2) not null default 30,
  bonus_amount numeric(12,2) not null default 0,
  goal_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  code text not null,
  name text not null,
  photo_url text,
  cost numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0,
  stock_qty integer not null default 0,
  created_at timestamptz not null default now(),
  unique (brand_id, code)
);

create table public.kits (                    -- maletas
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  number integer not null,
  reseller_id uuid not null references public.profiles (id) on delete restrict,
  sent_at date not null default current_date,
  due_at date,
  status text not null default 'open' check (status in ('open', 'settled')),
  -- valores congelados no fechamento do acerto
  commission_pct numeric(5,2),
  bonus_amount numeric(12,2),
  goal_amount numeric(12,2),
  adjust_amount numeric(12,2) not null default 0,  -- ajuste manual do ADM (+/-)
  settled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (brand_id, number)
);

create table public.kit_items (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  piece_id uuid not null references public.pieces (id) on delete restrict,
  price numeric(12,2),            -- preço congelado no acerto (antes: preço atual da peça)
  sold boolean not null default false,
  sold_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.profiles (brand_id);
create index on public.pieces (brand_id);
create index on public.kits (brand_id, status);
create index on public.kits (reseller_id);
create index on public.kit_items (kit_id);
create index on public.kit_items (piece_id);

-- ---------- Funções auxiliares ----------

create or replace function public.my_brand() returns uuid
language sql stable security definer set search_path = public as $$
  select brand_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and active)
$$;

-- Perfil criado a partir do convite quando a conta de login nasce
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where lower(email) = lower(new.email);
  if found then
    insert into public.profiles (id, brand_id, role, name, login, commission_pct, bonus_amount, goal_amount)
    values (new.id, inv.brand_id, 'reseller', inv.name, inv.login, inv.commission_pct, inv.bonus_amount, inv.goal_amount);
    delete from public.invites where email = inv.email;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Número da maleta sequencial por marca
create or replace function public.kits_set_number() returns trigger
language plpgsql as $$
begin
  if new.number is null then
    select coalesce(max(number), 0) + 1 into new.number from public.kits where brand_id = new.brand_id;
  end if;
  return new;
end $$;

create trigger kits_number before insert on public.kits
  for each row execute function public.kits_set_number();

-- Estoque: peça entra na maleta = sai do estoque; sai da maleta aberta = volta
create or replace function public.kit_items_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.pieces set stock_qty = stock_qty - 1 where id = new.piece_id;
    return new;
  elsif tg_op = 'DELETE' then
    if (select status from public.kits where id = old.kit_id) = 'open' then
      update public.pieces set stock_qty = stock_qty + 1 where id = old.piece_id;
    end if;
    return old;
  end if;
  return null;
end $$;

create trigger kit_items_stock_trg after insert or delete on public.kit_items
  for each row execute function public.kit_items_stock();

-- ---------- Ações (RPC) ----------

-- Revendedora (ou ADM) marca/desmarca peças vendidas de uma maleta aberta
create or replace function public.mark_sold(item_ids uuid[], is_sold boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.kit_items ki
     set sold = is_sold, sold_at = case when is_sold then now() else null end
    from public.kits k
   where ki.id = any(item_ids)
     and k.id = ki.kit_id
     and k.status = 'open'
     and k.brand_id = public.my_brand()
     and (public.is_admin() or k.reseller_id = auth.uid());
end $$;

-- ADM fecha o acerto: congela preços e regras, devolve ao estoque o que não vendeu
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
         goal_amount = r.goal_amount, adjust_amount = coalesce(p_adjust, 0)
   where id = p_kit;
end $$;

create or replace function public.mark_paid(p_kit uuid, p_paid boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Apenas o ADM marca pagamento'; end if;
  update public.kits set paid_at = case when p_paid then now() else null end
   where id = p_kit and brand_id = public.my_brand() and status = 'settled';
end $$;

-- ---------- Row Level Security ----------

alter table public.brands enable row level security;
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.pieces enable row level security;
alter table public.kits enable row level security;
alter table public.kit_items enable row level security;

create policy brands_read on public.brands for select using (id = public.my_brand());

create policy profiles_read on public.profiles for select
  using (id = auth.uid() or (public.is_admin() and brand_id = public.my_brand()));
create policy profiles_admin_write on public.profiles for update
  using (public.is_admin() and brand_id = public.my_brand())
  with check (brand_id = public.my_brand());

create policy invites_admin on public.invites for all
  using (public.is_admin() and brand_id = public.my_brand())
  with check (public.is_admin() and brand_id = public.my_brand());

create policy pieces_admin on public.pieces for all
  using (public.is_admin() and brand_id = public.my_brand())
  with check (public.is_admin() and brand_id = public.my_brand());
create policy pieces_reseller_read on public.pieces for select
  using (exists (select 1 from public.kit_items ki join public.kits k on k.id = ki.kit_id
                 where ki.piece_id = pieces.id and k.reseller_id = auth.uid()));

create policy kits_admin on public.kits for all
  using (public.is_admin() and brand_id = public.my_brand())
  with check (public.is_admin() and brand_id = public.my_brand());
create policy kits_reseller_read on public.kits for select using (reseller_id = auth.uid());

create policy kit_items_admin on public.kit_items for all
  using (public.is_admin() and brand_id = public.my_brand())
  with check (public.is_admin() and brand_id = public.my_brand());
create policy kit_items_reseller_read on public.kit_items for select
  using (exists (select 1 from public.kits k where k.id = kit_items.kit_id and k.reseller_id = auth.uid()));

-- ---------- Tempo real (preço novo aparece na hora) ----------
alter publication supabase_realtime add table public.pieces, public.kits, public.kit_items;

-- ---------- Fotos das peças ----------
insert into storage.buckets (id, name, public) values ('pecas', 'pecas', true)
  on conflict (id) do nothing;
create policy pecas_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'pecas' and public.is_admin()
              and (storage.foldername(name))[1] = public.my_brand()::text);
create policy pecas_update on storage.objects for update to authenticated
  using (bucket_id = 'pecas' and public.is_admin()
         and (storage.foldername(name))[1] = public.my_brand()::text);
