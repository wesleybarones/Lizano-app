import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useStore } from '../../store';
import { api } from '../../lib/api';
import { Empty, ErrorMsg, Screen } from '../../components/ui';
import PiecePicker, { qtyToIds } from './PiecePicker';
import { addDays, brl, today } from '../../lib/format';

export default function MaletaNova() {
  const { resellers, pieces, me } = useStore();
  const nav = useNavigate();
  const { busy, error, run, setError } = useAction();
  const ativas = resellers.filter((r) => r.active !== false);
  const [resellerId, setResellerId] = useState('');
  const [sentAt, setSentAt] = useState(today());
  const [dueAt, setDueAt] = useState(addDays(today(), 30));
  const [qty, setQty] = useState({});
  const ids = qtyToIds(qty);
  const total = ids.reduce((s, id) => s + Number(pieces.find((p) => p.id === id)?.price || 0), 0);

  async function submit(e) {
    e.preventDefault();
    if (!resellerId) return setError('Escolha a revendedora.');
    if (!ids.length) return setError('Coloque pelo menos uma peça na maleta.');
    const kit = await run(() => api.kits.create({ reseller_id: resellerId, sent_at: sentAt, due_at: dueAt, pieceIds: ids }, me.brand_id));
    if (kit) nav(`/maletas/${kit.id}`);
  }

  return (
    <Screen title="Nova maleta" back="/maletas">
      {ativas.length === 0 ? (
        <Empty>Cadastre uma revendedora antes de montar a maleta.</Empty>
      ) : (
        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="rev">Revendedora</label>
            <select id="rev" className="input" value={resellerId} onChange={(e) => setResellerId(e.target.value)} required>
              <option value="">Escolha…</option>
              {ativas.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="envio">Data de envio</label>
              <input id="envio" className="input" type="date" value={sentAt} onChange={(e) => setSentAt(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="prazo">Prazo do acerto</label>
              <input id="prazo" className="input" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
          </div>
          <h2 className="section-title">Peças</h2>
          {pieces.length === 0 ? <Empty>Cadastre peças primeiro.</Empty> : <PiecePicker pieces={pieces} qty={qty} setQty={setQty} />}
          <div className="card card--hl">
            <div className="row" style={{ borderColor: 'var(--line-gold-soft)' }}><span>Peças na maleta</span><b>{ids.length}</b></div>
            <div className="row"><span>Valor total</span><b>{brl(total)}</b></div>
          </div>
          <ErrorMsg>{error}</ErrorMsg>
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Criando…' : 'Criar maleta'}</button>
        </form>
      )}
    </Screen>
  );
}
