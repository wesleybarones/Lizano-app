import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, Screen, Thumb } from '../../components/ui';
import { brl } from '../../lib/format';

export default function Pecas() {
  const { pieces, kits, loaded } = useStore();
  const [q, setQ] = useState('');
  const naRua = useMemo(() => {
    const m = {};
    for (const k of kits) if (k.status === 'open') for (const i of k.items) if (!i.sold) m[i.piece_id] = (m[i.piece_id] || 0) + 1;
    return m;
  }, [kits]);
  const termo = q.trim().toLowerCase();
  const lista = pieces.filter((p) => !termo || p.name.toLowerCase().includes(termo) || p.code.toLowerCase().includes(termo));

  return (
    <Screen title="Peças">
      <div className="field">
        <label htmlFor="busca">Buscar por nome ou código</label>
        <input id="busca" className="input" type="search" placeholder="Ex.: colar, BR-102" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!loaded ? (
        <Loading />
      ) : lista.length === 0 ? (
        <Empty>{pieces.length ? 'Nenhuma peça encontrada.' : 'Nenhuma peça cadastrada ainda.'}</Empty>
      ) : (
        <div className="list">
          {lista.map((p) => (
            <Link key={p.id} to={`/pecas/${p.id}`} className="item" style={{ paddingLeft: 10 }}>
              <Thumb piece={p} />
              <div className="item__main">
                <span className="row__title">{p.name}</span>
                <span className="row__meta">{p.code} · {p.stock_qty} no estoque · {naRua[p.id] || 0} na rua</span>
              </div>
              <span className="row__value">{brl(p.price)}</span>
            </Link>
          ))}
        </div>
      )}
      <p className="note">Ao mudar um preço aqui, a revendedora vê o valor novo na hora.</p>
      <Link to="/pecas/nova" className="btn btn--primary">Cadastrar peça</Link>
    </Screen>
  );
}
