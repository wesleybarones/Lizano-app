# Log de Decisão · untangle-codebase

Repositório: `wesleybarones/Lizano-app` · commit `1ad0de2` · 17/11/2026
Tamanho: ~4.700 linhas (React + Vite + Supabase), 11 migrations, **nenhum teste**.

Etapa atual: **diagnóstico**. Nenhum arquivo do app foi alterado.

O código já está bem organizado (camada `api`, regras em `calc.js`, comentários úteis em português).
Os problemas abaixo são pontos onde uma mudança futura quebra em silêncio.

---

## 1. Vínculos ocultos (precisam mudar juntos, mas nada avisa)

| # | O quê | Onde |
|---|-------|------|
| V1 | **O modo demonstração é um segundo backend.** Toda regra do banco (estoque ao pôr/tirar peça, acerto, excluir peça/maleta, quem pode marcar venda) está reescrita à mão em JS. Mudou o SQL, tem que mudar o demo, e nada avisa. | `src/lib/demo.js:248-304` ↔ `001_inicial.sql:143-207`, `006`, `009` |
| V2 | **Lista de regras congeladas no acerto** (comissão, bônus, meta, tipo de meta) repetida em 4 lugares. Uma regra nova (ex.: bônus por categoria) exige mexer em todos. | `calc.js:19`, `demo.js:53-54` e `285-286`, `002_...sql:53-56`, `Relatorios.jsx:26` |
| V3 | **Comissão do relatório recalculada fora de `kitTotals`**, com a mesma escolha "acertada usa a regra congelada, aberta usa a atual". | `Relatorios.jsx:25-28` ↔ `calc.js:17-20` |
| V4 | **Normalização de celular e domínio `@celular.barones.app`** existem em JS e em SQL (duas vezes no SQL). | `format.js:22-35`, `whatsapp.js:8`, `007_...sql:24-27` e `63-68` |
| V5 | **Senha mínima de 6** repetida em 6 lugares. | `api.js:61,121,137`, `demo.js:145,218,226`, `007:18`, `008:8` |
| V6 | **"Precisa repor" (estoque ≤ mínimo, padrão 2)** escrito igual em duas telas, e o padrão 2 também no banco e na API. | `Pecas.jsx:72`, `Inicio.jsx:11`, `api.js:87`, `011.sql:2` |
| V7 | **Preço da peça vendida** calculado à mão em vez de `itemPrice`. | `MinhaMaleta.jsx:92` |
| V8 | **Só pode tirar peça não vendida de maleta aberta**: a regra está só no botão da tela. O banco devolve ao estoque mesmo se a peça foi vendida. | `Maleta.jsx:69` ↔ `001.sql:150`, `demo.js:260` |
| V9 | **"Maleta atual" = primeira aberta** depende da ordenação por número decrescente nas duas APIs. | `rev/common.js:2` ↔ `api.js:144`, `demo.js:234` |

## 2. Vínculos desnecessários (amarrados, mas mudam por motivos diferentes)

| # | O quê | Onde |
|---|-------|------|
| D1 | **Marca Lizano fixa no código** de um sistema que já é multi-marca no banco: telefone, @uselizano e site no PDF, "Lizano" como padrão em 8 telas, cores e nome no manifest. Vender para outra marca hoje é caça ao texto. | `pdf.js:23,49,72,78,202`, `terms.js` (`BRAND_PHONE`), `ui.jsx:58`, `Login.jsx:44,59`, `Vender.jsx:55`, `MeusNumeros.jsx:43`, `MinhaMaleta.jsx:22,24`, `Acerto.jsx:89`, `Historico.jsx:35`, `Termos.jsx:13`, `AceiteTermos.jsx:33,44`, `index.html:8`, `manifest.webmanifest` |
| D2 | **Cores dos gráficos em hexadecimal nas telas**, separadas de `styles.css`/`pdf.js`. Trocar a paleta pede editar 3 lugares. | `Relatorios.jsx:41,58-60`, `CurvaABC.jsx:9-13`, `pdf.js:9-16` |
| D3 | **`soldItems` exportado de uma tela** (`Relatorios.jsx`) e importado por outra tela. É regra de negócio morando em página. | `Relatorios.jsx:9` → `CurvaABC.jsx:7` |

## 3. Excesso / código morto

| # | O quê | Onde |
|---|-------|------|
| E1 | **Tabela `invites` + gatilho `handle_new_user`**: substituídos por `create_reseller` (007), mas o gatilho segue ativo em `auth.users`. O demo ainda guarda `invites: []`. | `001.sql:36-47,111-127,226-228`, `002.sql:15-16,20-33`, `demo.js:82` |
| E2 | Flag `demo: true` sem uso (o app usa `IS_DEMO`). `reset()` é usado no Login, mas não existe na API do Supabase: a tela depende de `IS_DEMO` para não chamar algo que não existe. | `demo.js:116` ↔ `Login.jsx:69` |

## 4. Casos especiais / gambiarras / riscos

| # | O quê | Onde |
|---|-------|------|
| G1 | **Data em UTC em vez de horário de Brasília.** Depois das 21h, `today()` já é "amanhã". Venda às 22h do dia 31 cai no mês seguinte no relatório e na Curva ABC, e "vendas de hoje" do painel some. | `format.js:11,15`, `Relatorios.jsx:10,36`, `Inicio.jsx:30`, `CurvaABC.jsx:18` |
| G2 | **Revendedora consegue ler o custo das peças.** A política `pieces_reseller_read` libera a linha inteira, com a coluna `cost`, e ela pode consultar direto no Supabase. Expõe a margem da marca. | `001.sql:233-235` |
| G3 | **Estoque pode ficar negativo.** O limite existe só na tela (`PiecePicker`); duas maletas montadas ao mesmo tempo passam do estoque. | `PiecePicker.jsx:15,36` ↔ `001.sql:147` (sem `check`) |
| G4 | **Truque no `delete_kit`**: marca a maleta como acertada antes de apagar só para o gatilho não devolver o estoque de novo. | `009.sql:19-20` |
| G5 | **Erro de recarga engolido**: falha vira `console.warn`, a tela mostra dados velhos sem aviso. | `store.jsx:31-34` |
| G6 | **Fotos de peças apagadas ficam no Storage** (não há política nem rotina de exclusão). | `001.sql:254-259`, `api.js:93-95` |
| G7 | **Código de peça arquivada fica bloqueado** (`unique(brand_id, code)` inclui arquivadas). | `001.sql:59`, `006.sql:24` |
| G8 | **Sem testes nem lint**: `// eslint-disable-line` sem ESLint instalado. Nada roda as regras de cálculo. | `package.json`, `PecaForm.jsx:23`, `RevendedoraForm.jsx:21` |

---

## 5. Redesenho proposto (poucas mudanças estruturais que resolvem vários itens)

| Correção | Resolve | Risco |
|----------|---------|-------|
| **C1 · `src/lib/rules.js` único**: regras congeladas (`kitRules(kit, reseller)`), senha mínima, "precisa repor", preço do item, vendas por mês. `kitTotals`, Relatórios, Curva ABC, telas e demo passam a importar daqui. | V2, V3, V5, V6, V7, D3 | Baixo: só JS, mesmo resultado |
| **C2 · Datas no fuso de Brasília**: `today()`, `monthKey()` e "vendida hoje" com `America/Sao_Paulo`. | G1 | Baixo; muda só vendas entre 21h e 0h |
| **C3 · `src/brand.js`** com nome, WhatsApp, Instagram, site e cores. PDF, termos e telas leem dali; `index.html`/manifest gerados pelo Vite a partir dele. | D1, D2 | Baixo: visual igual |
| **C4 · Migration `012`**: remove `invites` e o gatilho; põe `check (stock_qty >= 0)` (`not valid`, para não travar dados antigos); `kit_items` só sai do estoque se não vendida; `delete_kit` sem o truque do status; custo fora do alcance da revendedora (tabela `piece_costs` só do dono, ou view sem `cost`). | E1, G2, G3, G4, V8 | **Médio**: mexe no banco em produção. Precisa rodar no SQL Editor do Supabase e testar antes |
| **C5 · Demo espelhando C1/C4** + um teste simples (`node --test`) que roda o mesmo roteiro (montar maleta → vender → acertar → excluir) no demo e confere estoque e totais. | V1, V8, G8 | Baixo |
| **C6 · Pequenos**: aviso na tela quando a recarga falha; foto apagada junto com a peça. | G5, G6 | Baixo |

Fica fora por enquanto: **G7** (precisa decidir regra de negócio) e **V4** (SQL e JS não compartilham código; basta um comentário apontando um para o outro).

## Observações
- Sem acesso à internet nesta sessão, `npm ci` não roda aqui: build e teste ficam para o seu computador ou para a Vercel.
- Nada foi enviado ao GitHub. Este arquivo está só na cópia local.

---

## 6. Aplicado nesta branch (`untangle/regras-datas-marca`)

Aprovado: **C1, C2, C3 e parte do C6**. C4 (banco) e C5 (demo + teste) ficaram para depois.

| Correção | O que mudou | Itens resolvidos |
|----------|-------------|------------------|
| C1 | `calc.js` ganhou `RULE_FIELDS`, `pickRules`, `kitRules` e `soldItems`. `kitTotals`, Relatórios e demo usam essas funções. Novo `lib/rules.js` com senha mínima e "precisa repor". `MinhaMaleta` usa `itemPrice`. | V2 (no JS), V3, V5 (no JS), V6, V7, D3 |
| C2 | `format.js`: `localDay`, `today`, `monthKey` e `dateBR` no horário de Brasília; `addMonths` substitui a conta com `Date` no relatório. Painel compara "vendida hoje" pelo dia em Brasília. | G1 |
| C3 | Novo `src/brand.js` (nome, WhatsApp, Instagram, site, cores). PDF, termos, gráficos e telas leem dali; o nome vem do banco via `brandName` no store. Achado extra: o WhatsApp da marca estava duplicado em outro formato em `MinhaMaleta.jsx` (`BRAND_WA`); agora é derivado do mesmo número. | D1 (parte JS), D2 |
| C6 | Falha ao recarregar dados mostra aviso no topo de todas as telas (`syncError`). | G5 |

Ficou de fora:
- **G6 (fotos órfãs)**: apagar foto exige uma política de exclusão no Storage, ou seja, mudança no banco (C4).
- **index.html, manifest, styles.css e o monograma do PDF** continuam com o visual da Lizano. A lista desses arquivos está no topo de `src/brand.js`.
- **Senha mínima e celular no SQL**: ficam duplicados, com comentário em `rules.js` e `calc.js` apontando o arquivo do banco.

### Como foi verificado
Sem internet, `npm ci` e `vite build` não rodaram aqui.
- `tsc` com `allowJs` em todo o `src`: nenhum erro de sintaxe, nome inexistente ou import/export quebrado entre arquivos do projeto (o verificador foi testado com um import falso de propósito, e pegou).
- Teste com `tsx` comparando o código **antigo e o novo**:
  - `kitTotals`: igual em 5 cenários (aberta, meta por valor, sem regras, acertada, vazia).
  - "Precisa repor", celular e login: iguais ao antigo.
  - Datas: 22h30 do dia 17 em Brasília continua dia 17 (antes virava 18); 23h do dia 30/11 conta em novembro.
  - Modo demonstração: mesmo resultado em um roteiro completo (montar maleta → vender → acertar → cadastrar peça → senha curta).

**Antes de juntar na main:** rode `npm ci && npm run build` e abra o app no modo demonstração. Confira Relatórios, Curva ABC e um PDF de comprovante.
