import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAction, useStore } from '../../store';
import { api } from '../../lib/api';
import { ErrorMsg, Loading, Screen, Stat } from '../../components/ui';
import PiecePicker, { qtyToIds } from './PiecePicker';
import { kitTotals, itemPrice } from '../../lib/calc';
import { brl, dateBR, shortDate } from '../../lib/format';
import { kitStatus } from './Maletas';

export default function Maleta() {
  const { id } = useParams();
  const { kits, pieces, me, loaded } = useStore();
  const { busy, error, run } = useAction();
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState({});
  const k = kits.find((x) => x.id === id);
  if (!loaded) return <Screen title="Maleta" back="/maletas"><Loading /></Screen>;
  if (!k) return <Screen title="Maleta" back="/maletas"><p>Maleta não encontrada.</p></Screen>;
  const t = kitTotals(k);
  const open = k.status === 'open';
  const items = [...k.items].sort((a, b) => Number(b.sold) - Number(a.sold) || (a.piece?.name || '').localeCompare(b.piece?.name || ''));

  async function addPieces() {
    const ids = qtyToIds(qty);
    if (!ids.length) return setAdding(false);
    if (await run(() => api.kits.addItems(k.id, ids, me.brand_id))) {
      setQty({});
      setAdding(false);
    }
  }

  return (
    <Screen
      title={`Maleta nº ${k.number}`}
      sub={`${k.reseller?.name} · enviada em ${shortDate(k.sent_at)}${k.due_at ? ` · acerto em ${shortDate(k.due_at)}` : ''}`}
      back="/maletas"
      action={<span className={`pill ${kitStatus(k).cls}`}>{kitStatus(k).label}</span>}
    >
      <div className="card grid3">
        <Stat label="Enviadas" value={t.count} />
        <Stat label="Vendidas" value={t.soldCount} />
        <Stat label={open ? 'Com ela' : 'Devolvidas'} value={t.leftCount} />
      </div>
      <div className="card card--list">
        <div className="row"><span>Valor total da maleta</span><b>{brl(t.total)}</b></div>
        <div className="row"><span>{open ? 'Vendido até agora' : 'Vendido'}</span><b>{brl(t.soldTotal)}</b></div>
        {!open && <div className="row"><span>Acertada em</span><b>{dateBR(k.settled_at)}</b></div>}
      </div>

      <h2 className="section-title">Peças da maleta</h2>
      <div className="list">
        {items.map((i) => (
          <div key={i.id} className="item">
            <div className="item__main">
              <span className="row__title">{i.piece?.name}</span>
              <span className="row__meta">{i.piece?.code} · {brl(itemPrice(i))}</span>
            </div>
            {open && (
              <button type="button" className="btn btn--link" style={{ color: 'var(--gold-dark)', minHeight: 40, padding: '0 6px' }}
                onClick={() => run(() => api.kits.markSold([i.id], !i.sold))} disabled={busy}>
                {i.sold ? 'Desfazer' : 'Marcar vendida'}
              </button>
            )}
            <span className={`pill ${i.sold ? 'pill--ok' : ''}`}>{i.sold ? 'Vendida' : open ? 'Com ela' : 'Devolvida'}</span>
            {open && !i.sold && (
              <button type="button" className="btn btn--link" aria-label={`Tirar ${i.piece?.name} da maleta`}
                style={{ color: '#7a3b12', minHeight: 40, padding: '0 4px' }} onClick={() => run(() => api.kits.removeItem(i.id))} disabled={busy}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <ErrorMsg>{error}</ErrorMsg>

      {open && adding && (
        <>
          <h2 className="section-title">Adicionar peças</h2>
          <PiecePicker pieces={pieces} qty={qty} setQty={setQty} />
          <div className="btns">
            <button type="button" className="btn btn--ghost" onClick={() => { setQty({}); setAdding(false); }}>Cancelar</button>
            <button type="button" className="btn btn--primary" onClick={addPieces} disabled={busy}>Adicionar</button>
          </div>
        </>
      )}
      {open && !adding && (
        <div className="btns">
          <button type="button" className="btn btn--ghost" onClick={() => setAdding(true)}>Adicionar peça</button>
          <Link to={`/maletas/${k.id}/acerto`} className="btn btn--primary">Fazer acerto</Link>
        </div>
      )}
      {!open && <Link to={`/maletas/${k.id}/acerto`} className="btn btn--primary">Ver acerto</Link>}
    </Screen>
  );
}
