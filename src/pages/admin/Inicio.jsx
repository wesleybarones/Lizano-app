import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, Screen, Stat, Thumb } from '../../components/ui';
import WaButton from '../../components/WaButton';
import { kitTotals } from '../../lib/calc';
import { addDays, brl, shortDate, today } from '../../lib/format';
import { phoneOf, waLink } from '../../lib/whatsapp';

const first = (name) => String(name || '').split(' ')[0];
export const lowStock = (pieces) =>
  pieces.filter((p) => Number(p.min_stock ?? 2) > 0 && p.stock_qty <= Number(p.min_stock ?? 2));

export default function Inicio() {
  const { kits, pieces, loaded } = useStore();
  if (!loaded) return <Screen title="Início"><Loading /></Screen>;
  const hoje = today();
  const open = kits.filter((k) => k.status === 'open');
  const unpaid = kits.filter((k) => k.status === 'settled' && !k.paid_at);
  const aReceber = unpaid.reduce((s, k) => s + kitTotals(k).receivable, 0);
  const naRua = open.reduce((s, k) => s + kitTotals(k).leftCount, 0);
  const em3 = addDays(hoje, 3);
  const atrasados = open.filter((k) => k.due_at && k.due_at < hoje).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const vencendo = open.filter((k) => k.due_at && k.due_at >= hoje && k.due_at <= em3).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const proximos = open
    .filter((k) => !atrasados.includes(k) && !vencendo.includes(k))
    .sort((a, b) => String(a.due_at || '9').localeCompare(String(b.due_at || '9')));
  const em7 = open.filter((k) => k.due_at && k.due_at <= addDays(hoje, 7)).length;
  const repor = lowStock(pieces);
  const vendasHoje = open.flatMap((k) =>
    k.items.filter((i) => i.sold && String(i.sold_at || '').slice(0, 10) === hoje).map((i) => ({ ...i, kit: k })),
  );

  const lembrete = (k) => {
    const t = kitTotals(k);
    const quando = k.due_at < hoje ? `estava previsto para ${shortDate(k.due_at)}` : k.due_at === hoje ? 'é hoje' : `é dia ${shortDate(k.due_at)}`;
    return waLink(phoneOf(k.reseller),
      `Oi, ${first(k.reseller?.name)}! Passando para lembrar do acerto da maleta nº ${k.number}, que ${quando}. Até agora você marcou ${t.soldCount} ${t.soldCount === 1 ? 'peça vendida' : 'peças vendidas'} (${brl(t.soldTotal)}). Podemos combinar a devolução e o acerto?`);
  };
  const cobranca = (k) => {
    const t = kitTotals(k);
    return waLink(phoneOf(k.reseller),
      `Oi, ${first(k.reseller?.name)}! O acerto da maleta nº ${k.number} ficou em ${brl(t.receivable)}. Me avisa quando fizer o pagamento, por favor. Obrigada!`);
  };

  return (
    <Screen title="Início">
      <div className="grid2">
        <div className="card"><Stat label="A receber em aberto" value={brl(aReceber)} /></div>
        <div className="card"><Stat label="Maletas na rua" value={open.length} /></div>
        <div className="card"><Stat label="Peças com revendedoras" value={naRua} /></div>
        <div className="card"><Stat label="Acertos em 7 dias" value={em7} /></div>
      </div>

      {(atrasados.length > 0 || vencendo.length > 0) && (
        <>
          <h2 className="section-title">Acertos para cobrar</h2>
          {atrasados.map((k) => (
            <div key={k.id} className="alert alert--late">
              <div className="alert__row">
                <Link to={`/maletas/${k.id}`} style={{ color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
                  <b>{k.reseller?.name}</b><br />
                  <span>Maleta nº {k.number} · atrasado desde {shortDate(k.due_at)}</span>
                </Link>
                <WaButton small href={lembrete(k)}>Lembrar</WaButton>
              </div>
            </div>
          ))}
          {vencendo.map((k) => (
            <div key={k.id} className="alert alert--soon">
              <div className="alert__row">
                <Link to={`/maletas/${k.id}`} style={{ color: 'inherit', textDecoration: 'none', minWidth: 0 }}>
                  <b>{k.reseller?.name}</b><br />
                  <span>Maleta nº {k.number} · acerto {k.due_at === hoje ? 'hoje' : `em ${shortDate(k.due_at)}`}</span>
                </Link>
                <WaButton small href={lembrete(k)}>Lembrar</WaButton>
              </div>
            </div>
          ))}
        </>
      )}

      {unpaid.length > 0 && (
        <>
          <h2 className="section-title">Acertos esperando pagamento</h2>
          <div className="list">
            {unpaid.map((k) => (
              <div key={k.id} className="item">
                <Link to={`/maletas/${k.id}/acerto`} className="item__main" style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span className="row__title">{k.reseller?.name}</span>
                  <span className="row__meta">Maleta nº {k.number} · {brl(kitTotals(k).receivable)}</span>
                </Link>
                <WaButton small href={cobranca(k)}>Cobrar</WaButton>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Próximos acertos</h2>
      {proximos.length === 0 ? (
        <Empty>{open.length ? 'Os acertos próximos estão acima.' : 'Nenhuma maleta na rua.'}</Empty>
      ) : (
        <div className="list">
          {proximos.slice(0, 5).map((k) => (
            <Link key={k.id} to={`/maletas/${k.id}`} className="item">
              <div className="item__main">
                <span className="row__title">{k.reseller?.name}</span>
                <span className="row__meta">Maleta nº {k.number}{k.due_at ? ` · acerto em ${shortDate(k.due_at)}` : ''}</span>
              </div>
              <span className="row__value">{brl(kitTotals(k).receivable)}</span>
            </Link>
          ))}
        </div>
      )}

      {repor.length > 0 && (
        <>
          <h2 className="section-title">Peças para repor</h2>
          <div className="list">
            {repor.slice(0, 6).map((p) => (
              <Link key={p.id} to={`/pecas/${p.id}`} className="item" style={{ paddingLeft: 10 }}>
                <Thumb piece={p} />
                <div className="item__main">
                  <span className="row__title">{p.name}</span>
                  <span className="row__meta">{p.code} · mínimo {p.min_stock ?? 2}</span>
                </div>
                <span className="pill pill--repor">{p.stock_qty} no estoque</span>
              </Link>
            ))}
          </div>
          {repor.length > 6 && <Link to="/pecas" className="btn btn--link">Ver todas ({repor.length})</Link>}
        </>
      )}

      <h2 className="section-title">Vendas marcadas hoje</h2>
      {vendasHoje.length === 0 ? (
        <Empty>Nenhuma venda marcada hoje.</Empty>
      ) : (
        <div className="list">
          {vendasHoje.map((i) => (
            <div key={i.id} className="item">
              <div className="item__main">
                <span className="row__title">{i.piece?.name}</span>
                <span className="row__meta">Marcada por {i.kit.reseller?.name}</span>
              </div>
              <span className="row__value">{brl(i.piece?.price)}</span>
            </div>
          ))}
        </div>
      )}

      <Link to="/maletas/nova" className="btn btn--primary">Nova maleta</Link>
    </Screen>
  );
}
