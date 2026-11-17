import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useStore } from '../../store';
import { api } from '../../lib/api';
import { CategoryChips, Empty, ErrorMsg, Icon, Loading, Screen, Thumb } from '../../components/ui';
import { brl } from '../../lib/format';
import { currentKit } from './common';

export default function Vender() {
  const { kits, loaded, brandName } = useStore();
  const nav = useNavigate();
  const { busy, error, run } = useAction();
  const [sel, setSel] = useState([]);
  const [cat, setCat] = useState('');
  const k = currentKit(kits);
  if (!loaded) return <Screen title="Marcar venda"><Loading /></Screen>;
  if (!k) return <Screen title="Marcar venda"><Empty>Você não tem maleta no momento.</Empty></Screen>;
  const disponiveis = k.items.filter((i) => !i.sold);
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const total = disponiveis.filter((i) => sel.includes(i.id)).reduce((s, i) => s + Number(i.piece?.price || 0), 0);

  async function confirmar() {
    if (await run(() => api.kits.markSold(sel, true))) nav('/', { state: { sold: sel.length } });
  }
  return (
    <Screen title="Marcar venda" sub="Toque nas peças que você vendeu.">
      {disponiveis.length === 0 ? (
        <Empty>Todas as peças da maleta já foram vendidas.</Empty>
      ) : (
        <>
        <CategoryChips value={cat} onChange={setCat} pieces={disponiveis.map((i) => i.piece || {})} />
        <div className="list">
          {disponiveis.filter((i) => !cat || (i.piece?.category || 'outro') === cat).map((i) => (
            <button key={i.id} type="button" className="pick" aria-pressed={sel.includes(i.id)} onClick={() => toggle(i.id)}>
              <span className="check" aria-hidden="true">{sel.includes(i.id) && <Icon name="check" size={14} width={3.5} />}</span>
              <Thumb piece={i.piece} />
              <span className="item__main">
                <span className="row__title">{i.piece?.name}</span>
                <span className="row__meta">{i.piece?.code}</span>
              </span>
              <span className="row__value">{brl(i.piece?.price)}</span>
            </button>
          ))}
        </div>
        </>
      )}
      <div className="card card--list">
        <div className="row"><span>Peças selecionadas</span><b>{sel.length}</b></div>
        <div className="row"><span>Total da venda</span><b>{brl(total)}</b></div>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      <button type="button" className="btn btn--primary" disabled={!sel.length || busy} onClick={confirmar}>
        {busy ? 'Confirmando…' : 'Confirmar venda'}
      </button>
      <p className="note">A {brandName} vê a venda na hora. O valor entra no seu próximo acerto.</p>
    </Screen>
  );
}
