import { useMemo, useState } from 'react';
import DeletePiece from '../../components/DeletePiece';
import useLongPress from '../../components/useLongPress';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { byCategory, CategoryChips, Empty, Loading, Screen, Thumb } from '../../components/ui';
import { brl } from '../../lib/format';

export default function Pecas() {
  const { pieces, kits, loaded, reload } = useStore();
  const [del, setDel] = useState(null);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const naRua = useMemo(() => {
    const m = {};
    for (const k of kits) if (k.status === 'open') for (const i of k.items) if (!i.sold) m[i.piece_id] = (m[i.piece_id] || 0) + 1;
    return m;
  }, [kits]);
  const termo = q.trim().toLowerCase();
  const lista = pieces
    .filter(byCategory(cat))
    .filter((p) => !termo || p.name.toLowerCase().includes(termo) || p.code.toLowerCase().includes(termo));

  return (
    <Screen title="Peças">
      <div className="field">
        <label htmlFor="busca">Buscar por nome ou código</label>
        <input id="busca" className="input" type="search" placeholder="Ex.: colar, BR-102" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {pieces.length > 0 && <CategoryChips value={cat} onChange={setCat} pieces={pieces} />}
      {!loaded ? (
        <Loading />
      ) : lista.length === 0 ? (
        <Empty>{pieces.length ? 'Nenhuma peça encontrada.' : 'Nenhuma peça cadastrada ainda.'}</Empty>
      ) : (
        <div className="list">
          {lista.map((p) => (
            <PieceRow key={p.id} p={p} naRua={naRua[p.id] || 0} onLong={() => { setMsg(''); setDel(p); }} />
          ))}
        </div>
      )}
      {msg && <div className="ok-msg" role="status">{msg}</div>}
      <p className="note">Ao mudar um preço aqui, a revendedora vê o valor novo na hora. Para excluir uma peça, segure o dedo sobre ela por 1 segundo.</p>
      {del && (
        <DeletePiece
          piece={del}
          onClose={() => setDel(null)}
          onDone={async (r) => {
            setMsg(r === 'archived' ? `"${del.name}" foi excluída da lista (o histórico dos acertos foi mantido).` : `"${del.name}" foi excluída.`);
            setDel(null);
            await reload();
          }}
        />
      )}
      <Link to="/pecas/nova" className="btn btn--primary">Cadastrar peça</Link>
    </Screen>
  );
}

function PieceRow({ p, naRua, onLong }) {
  const { pressing, bind } = useLongPress(onLong);
  return (
    <Link to={`/pecas/${p.id}`} className={`item item--press ${pressing ? 'is-pressing' : ''}`} style={{ paddingLeft: 10 }} {...bind}>
      <Thumb piece={p} />
      <div className="item__main">
        <span className="row__title">{p.name}</span>
        <span className="row__meta">{p.code} · {p.stock_qty} no estoque · {naRua} na rua</span>
      </div>
      <span className="row__value">{brl(p.price)}</span>
    </Link>
  );
}
