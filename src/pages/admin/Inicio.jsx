import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, Screen, Stat } from '../../components/ui';
import { kitTotals } from '../../lib/calc';
import { addDays, brl, shortDate, today } from '../../lib/format';

export default function Inicio() {
  const { kits, loaded } = useStore();
  if (!loaded) return <Screen title="Início"><Loading /></Screen>;
  const open = kits.filter((k) => k.status === 'open');
  const unpaid = kits.filter((k) => k.status === 'settled' && !k.paid_at);
  const aReceber = unpaid.reduce((s, k) => s + kitTotals(k).receivable, 0);
  const naRua = open.reduce((s, k) => s + kitTotals(k).leftCount, 0);
  const limite = addDays(today(), 7);
  const proximos = [...open].sort((a, b) => String(a.due_at || '9').localeCompare(String(b.due_at || '9')));
  const em7 = open.filter((k) => k.due_at && k.due_at <= limite).length;
  const hoje = today();
  const vendasHoje = open.flatMap((k) =>
    k.items.filter((i) => i.sold && String(i.sold_at || '').slice(0, 10) === hoje).map((i) => ({ ...i, kit: k })),
  );

  return (
    <Screen title="Início">
      <div className="grid2">
        <div className="card"><Stat label="A receber em aberto" value={brl(aReceber)} /></div>
        <div className="card"><Stat label="Maletas na rua" value={open.length} /></div>
        <div className="card"><Stat label="Peças com revendedoras" value={naRua} /></div>
        <div className="card"><Stat label="Acertos em 7 dias" value={em7} /></div>
      </div>

      <h2 className="section-title">Próximos acertos</h2>
      {proximos.length === 0 ? (
        <Empty>Nenhuma maleta na rua.</Empty>
      ) : (
        <div className="list">
          {proximos.slice(0, 5).map((k) => {
            const t = kitTotals(k);
            const late = k.due_at && k.due_at < hoje;
            return (
              <Link key={k.id} to={`/maletas/${k.id}`} className="item">
                <div className="item__main">
                  <span className="row__title">{k.reseller?.name}</span>
                  <span className="row__meta">
                    Maleta nº {k.number}{k.due_at ? ` · acerto em ${shortDate(k.due_at)}` : ''}
                  </span>
                </div>
                {late ? <span className="pill pill--warn">Atrasado</span> : <span className="row__value">{brl(t.receivable)}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {unpaid.length > 0 && (
        <>
          <h2 className="section-title">Acertos esperando pagamento</h2>
          <div className="list">
            {unpaid.map((k) => (
              <Link key={k.id} to={`/maletas/${k.id}/acerto`} className="item">
                <div className="item__main">
                  <span className="row__title">{k.reseller?.name}</span>
                  <span className="row__meta">Maleta nº {k.number} · acertada em {shortDate(k.settled_at)}</span>
                </div>
                <span className="row__value">{brl(kitTotals(k).receivable)}</span>
              </Link>
            ))}
          </div>
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
