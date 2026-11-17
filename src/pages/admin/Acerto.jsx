import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAction, useStore } from '../../store';
import { api } from '../../lib/api';
import { ErrorMsg, Loading, Screen } from '../../components/ui';
import ReceiptButton from '../../components/ReceiptButton';
import WaButton from '../../components/WaButton';
import { phoneOf, waLink } from '../../lib/whatsapp';
import { kitTotals } from '../../lib/calc';
import { brl, dateBR, goalText, pct, shortDate } from '../../lib/format';

export default function Acerto() {
  const { id } = useParams();
  const { kits, loaded, brandName } = useStore();
  const { busy, error, run } = useAction();
  const [ajuste, setAjuste] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const k = kits.find((x) => x.id === id);
  if (!loaded) return <Screen title="Acerto" back="/maletas"><Loading /></Screen>;
  if (!k) return <Screen title="Acerto" back="/maletas"><p>Maleta não encontrada.</p></Screen>;
  const open = k.status === 'open';
  const t = kitTotals(open ? { ...k, adjust_amount: Number(ajuste) || 0 } : k);

  return (
    <Screen title="Acerto" sub={`Maleta nº ${k.number} · ${k.reseller?.name}${k.due_at ? ` · ${shortDate(k.due_at)}` : ''}`} back={`/maletas/${k.id}`}>
      <div className="card card--list">
        <div className="row">
          <div className="row__main"><span>Peças vendidas</span><span className="row__meta">{t.soldCount} peças</span></div>
          <span className="row__value">{brl(t.soldTotal)}</span>
        </div>
        <div className="row">
          <div className="row__main"><span>Peças devolvidas</span><span className="row__meta">{t.leftCount} peças {open ? 'voltam' : 'voltaram'} ao estoque</span></div>
          <span className="row__value">{brl(t.returnedTotal)}</span>
        </div>
        <div className="row">
          <div className="row__main"><span>Comissão da revendedora</span><span className="row__meta">{pct(t.commissionPct)} sobre o vendido</span></div>
          <span className="row__value">− {brl(t.commission)}</span>
        </div>
        <div className="row">
          <div className="row__main">
            <span>Bônus</span>
            <span className="row__meta">
              {t.goal > 0 ? `Meta de ${goalText(t.goalType, t.goal)} ${t.goalHit ? 'atingida' : 'não atingida'} (vendeu ${goalText(t.goalType, t.goalDone)})` : 'Sem meta definida'}
            </span>
          </div>
          <span className="row__value">− {brl(t.bonus)}</span>
        </div>
        {(!open && t.adjust !== 0) && (
          <div className="row"><span>Ajuste</span><span className="row__value">{t.adjust > 0 ? '+ ' : '− '}{brl(Math.abs(t.adjust))}</span></div>
        )}
      </div>

      {open && (
        <div className="field">
          <label htmlFor="ajuste">Ajuste (R$, opcional)</label>
          <input id="ajuste" className="input" type="number" inputMode="decimal" step="0.01" value={ajuste} onChange={(e) => setAjuste(e.target.value)} placeholder="Ex.: -20 ou 15" />
          <span className="hint">Use para descontos ou acréscimos combinados com a revendedora.</span>
        </div>
      )}

      <div className="card card--hl">
        <span className="stat__label">A receber da revendedora</span>
        <span className="stat__value stat__value--xl">{brl(t.receivable)}</span>
        {!open && <span className="stat__label">{k.paid_at ? `Pago em ${dateBR(k.paid_at)}` : 'Aguardando pagamento'}</span>}
      </div>
      <p className="note">O pagamento acontece fora do app. Quando receber, marque como pago e o acerto vai para o histórico dos dois lados.</p>
      <ErrorMsg>{error}</ErrorMsg>

      {open ? (
        confirmar ? (
          <div className="card stack">
            <b>Fechar o acerto?</b>
            <span className="row__meta">As {t.leftCount} peças não vendidas voltam ao estoque e os valores ficam congelados.</span>
            <div className="btns">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmar(false)}>Voltar</button>
              <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run(() => api.kits.settle(k.id, ajuste))}>Fechar acerto</button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => setConfirmar(true)}>Fechar acerto</button>
        )
      ) : k.paid_at ? (
        <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => run(() => api.kits.markPaid(k.id, false))}>Desmarcar pagamento</button>
      ) : (
        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => run(() => api.kits.markPaid(k.id, true))}>Marcar como pago</button>
      )}
      {!open && (
        <div className="btns" style={{ alignItems: 'center' }}>
          <ReceiptButton kit={k} brand={brandName} label="Comprovante (PDF)" />
          {!k.paid_at && (
            <WaButton href={waLink(phoneOf(k.reseller), `Oi, ${k.reseller?.name?.split(' ')[0] || ''}! O acerto da maleta nº ${k.number} ficou em ${brl(t.receivable)} (vendido ${brl(t.soldTotal)}, comissão ${brl(t.commission)}${t.bonus ? `, bônus ${brl(t.bonus)}` : ''}). Me avisa quando fizer o pagamento, por favor. Obrigada!`)}>
              Cobrar
            </WaButton>
          )}
        </div>
      )}
      <Link to={`/maletas/${k.id}`} className="btn btn--link">Voltar para a maleta</Link>
    </Screen>
  );
}
