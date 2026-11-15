import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, Screen, Stat, Thumb } from '../../components/ui';
import { kitTotals } from '../../lib/calc';
import { brl, shortDate } from '../../lib/format';
import { currentKit } from './common';

export default function MinhaMaleta() {
  const { kits, loaded, signOut } = useStore();
  const k = currentKit(kits);
  const sair = <button type="button" className="btn btn--link" onClick={signOut} style={{ minHeight: 36, padding: 0 }}>Sair</button>;
  if (!loaded) return <Screen title="Minha maleta" action={sair}><Loading /></Screen>;
  if (!k) return <Screen title="Minha maleta" action={sair}><Empty>Você não tem maleta no momento. Quando a Lizano enviar, ela aparece aqui.</Empty></Screen>;
  const t = kitTotals(k);
  const items = [...k.items].sort((a, b) => Number(a.sold) - Number(b.sold) || (a.piece?.name || '').localeCompare(b.piece?.name || ''));
  return (
    <Screen title="Minha maleta" sub={`Maleta nº ${k.number}${k.due_at ? ` · acerto em ${shortDate(k.due_at)}` : ''}`} action={sair}>
      <div className="card grid2">
        <Stat label="Com você" value={t.leftCount} />
        <Stat label="Já vendidas" value={t.soldCount} />
      </div>
      <h2 className="section-title">Peças</h2>
      <div className="list">
        {items.map((i) => (
          <div key={i.id} className="item" style={{ paddingLeft: 10 }}>
            <Thumb piece={i.piece} />
            <div className="item__main">
              <span className="row__title">{i.piece?.name}</span>
              <span className="row__meta">{brl(i.price ?? i.piece?.price)}</span>
            </div>
            <span className={`pill ${i.sold ? 'pill--ok' : ''}`}>{i.sold ? 'Vendida' : 'Com você'}</span>
          </div>
        ))}
      </div>
      <Link to="/vender" className="btn btn--primary">Marcar venda</Link>
    </Screen>
  );
}
