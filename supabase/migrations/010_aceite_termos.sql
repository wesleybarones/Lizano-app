-- =====================================================================
--  010 · Aceite dos Termos de Uso e da Política de Privacidade (LGPD)
--  Guarda a versão aceita e a data/hora do aceite de cada usuária.
-- =====================================================================
alter table public.profiles add column if not exists terms_version text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- A própria usuária registra o aceite (ela não pode alterar mais nada do perfil)
create or replace function public.accept_terms(p_version text) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Faça login para aceitar os termos.'; end if;
  if coalesce(btrim(p_version), '') = '' then raise exception 'Versão dos termos inválida.'; end if;
  update public.profiles set terms_version = p_version, terms_accepted_at = t where id = auth.uid();
  return t;
end $$;

revoke all on function public.accept_terms(text) from public;
grant execute on function public.accept_terms(text) to authenticated;
