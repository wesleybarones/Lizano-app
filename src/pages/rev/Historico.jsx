import { useStore } from '../../store';
import { Empty, Loading, Screen } from '../../components/ui';
import ReceiptButton from '../../components/ReceiptButton';
import { kitTotals } from '../../lib/calc';
import { brl, shortDate } from '../../lib/format';

export default function Historico() {
  const { kits, loaded, me } = useStore();
  const fechadas = kits.filter((k) => k.status === 'settled');
  return (
    <Screen title="Histórico" sub="Suas maletas e acertos anteriores.">
      {!loaded ? (
        <Loading />
      ) : fechadas.length === 0 ? (
        <Empty>Nenhum acerto fechado ainda.</Empty>
      ) : (
        <div className="list">
          {fechadas.map((k) => {
            const t = kitTotals(k);
            return (
              <div key={k.id} className="card">
                <div className="chart-head">
                  <div className="row__main">
                    <span className="row__title">Maleta nº {k.number}</span>
                    <span className="row__meta">{shortDate(k.sent_at)} a {shortDate(k.settled_at)}</span>
                  </div>
                  <span className={`pill ${k.paid_at ? 'pill--ok' : 'pill--warn'}`}>{k.paid_at ? 'Pago' : 'A pagar'}</span>
                </div>
                <div className="grid3" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <div className="stat"><span className="stat__label">Vendido</span><b>{brl(t.soldTotal)}</b></div>
                  <div className="stat"><span className="stat__label">Comissão</span><b>{brl(t.commission)}</b></div>
                  <div className="stat"><span className="stat__label">Bônus</span><b>{brl(t.bonus)}</b></div>
                </div>
                <div className="row" style={{ minHeight: 36 }}><span className="row__meta">Repassado</span><b>{brl(t.receivable)}</b></div>
                <ReceiptButton kit={k} brand={me?.brand_name || 'Lizano'} className="mini-btn" label="Baixar comprovante (PDF)" />
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
