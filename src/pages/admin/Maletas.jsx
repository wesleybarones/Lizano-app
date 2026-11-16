import { useState } from 'react';
import DeleteKit from '../../components/DeleteKit';
import useLongPress from '../../components/useLongPress';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, Screen } from '../../components/ui';
import { kitTotals } from '../../lib/calc';
import { brl, shortDate } from '../../lib/format';

export function kitStatus(k) {
  if (k.status === 'open') return { label: 'Na rua', cls: '' };
  if (!k.paid_at) return { label: 'A receber', cls: 'pill--warn' };
  return { label: 'Pago', cls: 'pill--ok' };
}

export default function Maletas() {
  const { kits, loaded, reload } = useStore();
  const [filtro, setFiltro] = useState('open');
  const [del, setDel] = useState(null);
  const [msg, setMsg] = useState('');
  const lista = kits.filter((k) =>
    filtro === 'open' ? k.status === 'open' : filtro === 'unpaid' ? k.status === 'settled' && !k.paid_at : k.status === 'settled' && k.paid_at,
  );
  return (
    <Screen title="Maletas">
      <div className="toggle" role="group" aria-label="Filtrar maletas" style={{ alignSelf: 'flex-start' }}>
        {[['open', 'Na rua'], ['unpaid', 'A receber'], ['paid', 'Pagas']].map(([v, l]) => (
          <button key={v} type="button" aria-pressed={filtro === v} onClick={() => setFiltro(v)}>{l}</button>
        ))}
      </div>
      {!loaded ? (
        <Loading />
      ) : lista.length === 0 ? (
        <Empty>Nenhuma maleta aqui.</Empty>
      ) : (
        <div className="list">
          {lista.map((k) => <KitRow key={k.id} k={k} onLong={() => { setMsg(''); setDel(k); }} />)}
        </div>
      )}
      {msg && <div className="ok-msg" role="status">{msg}</div>}
      <p className="note">Para excluir uma maleta, segure o dedo sobre ela por 1 segundo.</p>
      <Link to="/maletas/nova" className="btn btn--primary">Nova maleta</Link>
      {del && (
        <DeleteKit kit={del} onClose={() => setDel(null)}
          onDone={async () => { setMsg(`Maleta nº ${del.number} excluída.`); setDel(null); await reload(); }} />
      )}
    </Screen>
  );
}

function KitRow({ k, onLong }) {
  const { pressing, bind } = useLongPress(onLong);
  const t = kitTotals(k);
  const s = kitStatus(k);
  return (
    <Link to={`/maletas/${k.id}`} className={`item item--press ${pressing ? 'is-pressing' : ''}`} {...bind}>
      <div className="item__main">
        <span className="row__title">Nº {k.number} · {k.reseller?.name}</span>
        <span className="row__meta">
          {k.status === 'open'
            ? `${t.soldCount} de ${t.count} vendidas${k.due_at ? ` · acerto ${shortDate(k.due_at)}` : ''}`
            : `A receber ${brl(t.receivable)}`}
        </span>
      </div>
      <span className={`pill ${s.cls}`}>{s.label}</span>
    </Link>
  );
}
