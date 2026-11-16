-- =====================================================================
--  008 · O dono redefine a senha de uma revendedora da marca dele
-- =====================================================================
create or replace function public.reset_reseller_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'Apenas o ADM redefine senhas'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres.'; end if;
  if not exists (select 1 from public.profiles
                  where id = p_user and role = 'reseller' and brand_id = public.my_brand()) then
    raise exception 'Revendedora não encontrada.';
  end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now()
   where id = p_user;
end $$;

revoke all on function public.reset_reseller_password(uuid, text) from public;
grant execute on function public.reset_reseller_password(uuid, text) to authenticated;
