-- =====================================================================
--  003 · Login por e-mail OU celular na mesma conta
--  O celular fica no perfil (só dígitos, com 55 na frente). No login por
--  celular, o app descobre o e-mail da conta por esta função.
-- =====================================================================

alter table public.profiles add column if not exists phone text;
create unique index if not exists profiles_phone_key on public.profiles (phone) where phone is not null;

create or replace function public.login_email(p_phone text) returns text
language sql stable security definer set search_path = public as $$
  select u.email
    from public.profiles p
    join auth.users u on u.id = p.id
   where p.phone = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
     and p.active
   limit 1
$$;

revoke all on function public.login_email(text) from public;
grant execute on function public.login_email(text) to anon, authenticated;
