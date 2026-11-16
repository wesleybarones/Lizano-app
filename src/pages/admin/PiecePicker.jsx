import { useState } from 'react';
import { byCategory, CategoryChips, Thumb } from '../../components/ui';
import { brl } from '../../lib/format';

/* Escolhe peças e quantidades (limitadas ao estoque) */
export default function PiecePicker({ pieces, qty, setQty }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const termo = q.trim().toLowerCase();
  const lista = pieces
    .filter(byCategory(cat))
    .filter((p) => !termo || p.name.toLowerCase().includes(termo) || p.code.toLowerCase().includes(termo));
  const change = (p, d) =>
    setQty((m) => {
      const v = Math.max(0, Math.min(p.stock_qty, (m[p.id] || 0) + d));
      return { ...m, [p.id]: v };
    });
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="busca-peca">Buscar peça</label>
        <input id="busca-peca" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou código" />
      </div>
      <CategoryChips value={cat} onChange={setCat} pieces={pieces} />
      <div className="list">
        {lista.map((p) => (
          <div key={p.id} className="item" style={{ paddingLeft: 10 }}>
            <Thumb piece={p} />
            <div className="item__main">
              <span className="row__title">{p.name}</span>
              <span className="row__meta">{p.code} · {brl(p.price)} · {p.stock_qty} no estoque</span>
            </div>
            <div className="qty">
              <button type="button" aria-label={`Tirar uma ${p.name}`} onClick={() => change(p, -1)} disabled={!qty[p.id]}>−</button>
              <span aria-live="polite">{qty[p.id] || 0}</span>
              <button type="button" aria-label={`Pôr mais uma ${p.name}`} onClick={() => change(p, 1)} disabled={(qty[p.id] || 0) >= p.stock_qty}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function qtyToIds(qty) {
  return Object.entries(qty).flatMap(([id, n]) => Array(n).fill(id));
}
