import { useStore } from '../../store';
import { Empty, Loading, Screen, Stat } from '../../components/ui';
import { kitTotals } from '../../lib/calc';
import { brl, goalText, pct, shortDate } from '../../lib/format';
import { currentKit } from './common';

export default function MeusNumeros() {
  const { kits, me, loaded } = useStore();
  const k = currentKit(kits);
  if (!loaded) return <Screen title="Meus números"><Loading /></Screen>;
  if (!k) return <Screen title="Meus números"><Empty>Você não tem maleta no momento.</Empty></Screen>;
  const t = kitTotals(k, me);
  return (
    <Screen title="Meus números" sub={`Maleta nº ${k.number}${k.due_at ? ` · acerto em ${shortDate(k.due_at)}` : ''}`}>
      <div className="card card--hl">
        <span className="stat__label">Você repassa no acerto</span>
        <span className="stat__value stat__value--xl">{brl(t.receivable)}</span>
        <span className="stat__label">Vendido {brl(t.soldTotal)} − sua comissão − seu bônus</span>
      </div>
      <div className="grid2">
        <div className="card"><Stat label={`Sua comissão (${pct(t.commissionPct)})`} value={brl(t.commission)} /></div>
        <div className="card"><Stat label="Seu bônus" value={brl(t.bonus)} /></div>
      </div>
      {t.goal > 0 && (
        <div className="card">
          <div className="chart-head">
            <h2>Meta da maleta</h2>
            <span className={`pill ${t.goalHit ? 'pill--ok' : ''}`}>{t.goalHit ? 'Atingida' : `${Math.round(t.goalProgress * 100)}%`}</span>
          </div>
          <div className="progress" role="img" aria-label={`Progresso da meta: ${Math.round(t.goalProgress * 100)}%`}>
            <div style={{ width: `${t.goalProgress * 100}%` }} />
          </div>
          <span className="row__meta">
            Você vendeu {goalText(t.goalType, t.goalDone)} de uma meta de {goalText(t.goalType, t.goal)}.
            {!t.goalHit && t.bonusAmount > 0 ? ` ${t.goalType === 'pieces' && t.goal - t.goalDone === 1 ? 'Falta' : 'Faltam'} ${goalText(t.goalType, t.goal - t.goalDone)} para ganhar ${brl(t.bonusAmount)} de bônus.` : ''}
          </span>
        </div>
      )}
      <div className="card card--list">
        <div className="row"><span>Peças vendidas</span><b>{t.soldCount}</b></div>
        <div className="row"><span>Peças com você</span><b>{t.leftCount}</b></div>
      </div>
      <p className="note">Comissão, bônus e meta são definidos pela Lizano.</p>
    </Screen>
  );
}
