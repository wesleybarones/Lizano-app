import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, Screen } from '../../components/ui';
import { kitTotals } from '../../lib/calc';
import { brl, dateBR, goalText, initials, pct } from '../../lib/format';
import { TERMS_VERSION } from '../../lib/terms';

export default function Equipe() {
  const { resellers, kits, loaded } = useStore();
  return (
    <Screen title="Revendedoras">
      {!loaded ? (
        <Loading />
      ) : resellers.length === 0 ? (
        <Empty>Nenhuma revendedora cadastrada ainda.</Empty>
      ) : (
        <div className="list">
          {resellers.map((r) => {
            const mine = kits.filter((k) => k.reseller_id === r.id);
            const atual = mine.find((k) => k.status === 'open');
            const emAberto = mine
              .filter((k) => k.status === 'settled' && !k.paid_at)
              .reduce((s, k) => s + kitTotals(k).receivable, 0);
            return (
              <Link key={r.id} to={`/equipe/${r.id}`} className="item">
                <div className="avatar" aria-hidden="true">{initials(r.name)}</div>
                <div className="item__main">
                  <span className="row__title">{r.name}{r.active === false ? ' (inativa)' : ''}</span>
                  <span className={`row__meta ${r.terms_version === TERMS_VERSION ? '' : 'terms-pending'}`} style={{ fontSize: 11 }}>
                    {r.terms_version === TERMS_VERSION
                      ? `✓ Termos aceitos em ${dateBR(r.terms_accepted_at)}`
                      : r.terms_version ? 'Termos atualizados: aceite pendente' : 'Termos ainda não aceitos'}
                  </span>
                  <span className="row__meta">
                    Comissão {pct(r.commission_pct)}{Number(r.goal_amount) > 0 ? ` · meta ${goalText(r.goal_type, r.goal_amount)}` : ''} · {atual ? `maleta nº ${atual.number}` : 'sem maleta'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span className="row__meta" style={{ fontSize: 11 }}>Em aberto</span>
                  <span className="row__value">{brl(emAberto)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <p className="note">Comissão, bônus e meta podem ser diferentes para cada revendedora.</p>
      <Link to="/equipe/nova" className="btn btn--primary">Nova revendedora</Link>
    </Screen>
  );
}
