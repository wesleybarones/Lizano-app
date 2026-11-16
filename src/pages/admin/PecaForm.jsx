import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAction, useStore } from '../../store';
import { api } from '../../lib/api';
import { ErrorMsg, Loading, Screen, Thumb } from '../../components/ui';
import PhotoPicker from '../../components/PhotoPicker';

const EMPTY = { code: '', name: '', cost: '', price: '', stock_qty: '', photo_url: '' };

export default function PecaForm() {
  const { id } = useParams();
  const { pieces, me, loaded } = useStore();
  const nav = useNavigate();
  const { busy, error, run } = useAction();
  const [form, setForm] = useState(EMPTY);
  const existing = id ? pieces.find((p) => p.id === id) : null;

  useEffect(() => {
    if (existing) setForm({ ...EMPTY, ...existing, photo_url: existing.photo_url || '' });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (id && !loaded) return <Screen title="Peça" back="/pecas"><Loading /></Screen>;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (await run(() => api.pieces.save(form, me.brand_id))) nav('/pecas');
  }

  return (
    <Screen title={id ? 'Editar peça' : 'Nova peça'} back="/pecas">
      <form className="stack" onSubmit={submit}>
        <div className="card" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Thumb piece={form} />
          <PhotoPicker
            label="Foto da peça"
            hasPhoto={!!form.photo_url}
            onPick={async (file) => {
              const url = await api.pieces.uploadPhoto(file, me.brand_id);
              setForm((f) => ({ ...f, photo_url: url }));
            }}
            onRemove={() => setForm((f) => ({ ...f, photo_url: '' }))}
          />
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="code">Código</label>
            <input id="code" className="input" required value={form.code} onChange={set('code')} placeholder="BR-102" />
          </div>
          <div className="field">
            <label htmlFor="estoque">Quantidade em estoque</label>
            <input id="estoque" className="input" type="number" inputMode="numeric" min="0" step="1" required value={form.stock_qty} onChange={set('stock_qty')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input id="nome" className="input" required value={form.name} onChange={set('name')} placeholder="Brinco argola dourada" />
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="custo">Custo (R$)</label>
            <input id="custo" className="input" type="number" inputMode="decimal" min="0" step="0.01" value={form.cost} onChange={set('cost')} />
          </div>
          <div className="field">
            <label htmlFor="preco">Preço de venda (R$)</label>
            <input id="preco" className="input" type="number" inputMode="decimal" min="0" step="0.01" required value={form.price} onChange={set('price')} />
          </div>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar peça'}</button>
      </form>
    </Screen>
  );
}
