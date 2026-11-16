-- =====================================================================
--  007 · O dono cria o acesso da revendedora direto pelo banco
--  O cadastro público do Supabase pode ficar DESLIGADO (mais seguro):
--  só um ADM, por esta função, cria contas, sempre na marca dele.
-- =====================================================================
create or replace function public.create_reseller(
  p_name text, p_login text, p_password text,
  p_commission numeric, p_bonus numeric, p_goal numeric, p_goal_type text
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := gen_random_uuid();
  v_login text := btrim(coalesce(p_login, ''));
  v_phone text;
  v_email text;
begin
  if not public.is_admin() then raise exception 'Apenas o ADM cria revendedoras'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  if btrim(coalesce(p_name, '')) = '' then raise exception 'Informe o nome da revendedora.'; end if;

  if position('@' in v_login) > 0 then
    v_email := lower(v_login);
  else
    v_phone := regexp_replace(v_login, '\D', '', 'g');
    if length(v_phone) in (10, 11) then v_phone := '55' || v_phone; end if;
    if length(v_phone) < 12 then raise exception 'Informe um celular com DDD ou um e-mail.'; end if;
    v_email := v_phone || '@celular.barones.app';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email)
     or (v_phone is not null and exists (select 1 from public.profiles where phone = v_phone)) then
    raise exception 'Já existe um acesso com esse celular ou e-mail.';
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', v_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now());

  -- o gatilho de convite não se aplica aqui; o perfil é criado direto
  insert into public.profiles (id, brand_id, role, name, login, phone,
    commission_pct, bonus_amount, goal_amount, goal_type)
  values (uid, public.my_brand(), 'reseller', btrim(p_name), v_login, v_phone,
    coalesce(p_commission, 0), coalesce(p_bonus, 0), coalesce(p_goal, 0),
    case when p_goal_type = 'value' then 'value' else 'pieces' end);

  return uid;
end $$;

revoke all on function public.create_reseller(text, text, text, numeric, numeric, numeric, text) from public;
grant execute on function public.create_reseller(text, text, text, numeric, numeric, numeric, text) to authenticated;

-- login por celular aceita o número com ou sem 55
create or replace function public.login_email(p_phone text) returns text
language sql stable security definer set search_path = public as $$
  with d as (select regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') v)
  select u.email
    from public.profiles p
    join auth.users u on u.id = p.id, d
   where p.active
     and p.phone = case when length(d.v) in (10, 11) then '55' || d.v else d.v end
   limit 1
$$;
