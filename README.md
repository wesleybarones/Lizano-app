# Barones Labs · Sistema de consignado

App de controle de consignado de semijoias. Primeiro cliente: **Lizano Semijoias**.
O sistema **não movimenta dinheiro**: registra peças, maletas, vendas, comissões e acertos, só para controle.

- **Dono (ADM):** peças, revendedoras, maletas, acertos e relatórios com gráficos (incluindo curva ABC).
- **Revendedora:** vê a própria maleta, marca as peças vendidas, acompanha comissão, bônus, meta e histórico.

Feito em React + Vite, instalável no celular (PWA). Banco, login e fotos no Supabase. Hospedagem na Vercel.

## Rodar no computador

```bash
npm ci
npm run dev
```

Sem as chaves do Supabase o app abre no **modo demonstração**, com dados de exemplo salvos no navegador
(login `dono` ou `carla`, senha `123456`).

## Ligar no Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. **SQL Editor**: cole e rode, em ordem, os arquivos de `supabase/migrations/` (001, 002…).
3. **Authentication › Sign In / Providers**: pode deixar **desligado** *Allow new users to sign up*
   (mais seguro). As contas das revendedoras são criadas pelo dono no app, pela função
   `create_reseller` do banco, já confirmadas.
4. **Authentication › Users › Add user**: crie o usuário do dono (e-mail e senha), marcando *Auto Confirm*.
5. **SQL Editor**: crie a marca e ligue o dono a ela (troque o e-mail):

   ```sql
   with b as (insert into public.brands (name) values ('Lizano') returning id)
   insert into public.profiles (id, brand_id, role, name, login)
   select u.id, b.id, 'admin', 'Dono da Lizano', u.email
     from auth.users u, b
    where u.email = 'dono@exemplo.com';
   ```

6. **Project Settings › API**: copie *Project URL* e a chave *anon public* para o `.env`
   (veja `.env.example`) e para as variáveis de ambiente da Vercel:
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Revendedoras são criadas pelo próprio dono no app (Equipe › Nova revendedora), sem cadastro público.
Todos entram com **e-mail ou celular** (qualquer formato: `+55 21 99999-9999`, `21999999999`…).
Uma conta de e-mail pode ter também um celular (`profiles.phone`, só dígitos com 55): o login por
celular descobre o e-mail pela função `login_email`. Revendedora criada só com celular vira
internamente `55DDDNUMERO@celular.barones.app`.

## Outra marca no futuro

Repita o passo 5 com o nome da nova marca e o usuário do dono dela.
Cada marca só enxerga os próprios dados (regras de acesso no banco, *Row Level Security*).

## Regras de cálculo

- **Vendido** = soma do preço das peças marcadas como vendidas
- **Comissão** = % da revendedora × vendido
- **Bônus** = valor fixo quando a revendedora bate a meta (meta 0 = sem bônus). A meta é por
  **quantidade de peças vendidas** (padrão) ou por **valor vendido**; o dono escolhe para cada revendedora
- **A receber** = vendido − comissão − bônus + ajuste do dono
- Até o acerto, vale o preço atual da peça (mudou o preço, a revendedora vê na hora).
  No acerto, preços e regras ficam congelados e as peças não vendidas voltam ao estoque.
- **Curva ABC**: faturamento por peça no mês; A até 80% do acumulado, B até 95%, C o resto.
