import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Loading, PieBars, Screen, Stat, CHART_COLORS } from '../../components/ui';
import { itemPrice, kitRules, kitTotals, soldItems } from '../../lib/calc';
import { addMonths, brl, monthKey, monthLabel, MONTHS, today } from '../../lib/format';
import { BRAND } from '../../brand';

const C = BRAND.colors;

export default function Relatorios() {
  const { kits, pieces, resellers, loaded } = useStore();
  const all = useMemo(() => soldItems(kits), [kits]);
  const months = useMemo(() => {
    const set = new Set([monthKey(today()), ...all.map((i) => i.month)]);
    return [...set].sort().reverse();
  }, [all]);
  const [mes, setMes] = useState(monthKey(today()));
  if (!loaded) return <Screen title="Relatórios"><Loading /></Screen>;

  const doMes = all.filter((i) => i.month === mes);
  const vendido = doMes.reduce((s, i) => s + itemPrice(i), 0);
  const comissoes = doMes.reduce((s, i) => s + (itemPrice(i) * (Number(kitRules(i.kit).commission_pct) || 0)) / 100, 0);
  const emAberto = kits.filter((k) => k.status === 'settled' && !k.paid_at).reduce((s, k) => s + kitTotals(k).receivable, 0);

  // últimos 6 meses até o mês escolhido
  const ultimos = [5, 4, 3, 2, 1, 0].map((n) => addMonths(mes, -n));
  const porMes = ultimos.map((m, k) => ({
    label: MONTHS[Number(m.slice(5)) - 1],
    value: Math.round(all.filter((i) => i.month === m).reduce((s, i) => s + itemPrice(i), 0) * 100) / 100,
    color: [C.goldPale, C.goldLight, C.gold, C.goldDark, C.ink2, C.navy][k],
  }));
  const porRev = resellers
    .map((r) => ({ label: r.name, value: doMes.filter((i) => i.kit.reseller_id === r.id).reduce((s, i) => s + itemPrice(i), 0) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((x, k) => ({ ...x, color: CHART_COLORS[k % CHART_COLORS.length] }));
  const ranking = resellers
    .map((r) => {
      const its = doMes.filter((i) => i.kit.reseller_id === r.id);
      return { id: r.id, name: r.name, qty: its.length, value: its.reduce((s2, i) => s2 + itemPrice(i), 0) };
    })
    .filter((r) => r.qty > 0)
    .sort((a, b) => b.value - a.value || b.qty - a.qty);
  const comRev = kits.filter((k) => k.status === 'open').reduce((s, k) => s + k.items.filter((i) => !i.sold).length, 0);
  const estoque = pieces.reduce((s, p) => s + Math.max(0, p.stock_qty), 0);
  const onde = [
    { label: 'Com revendedoras', value: comRev, color: C.navy },
    { label: 'No estoque', value: estoque, color: C.goldDark },
    { label: 'Vendidas no mês', value: doMes.length, color: C.gold },
  ];

  return (
    <Screen title="Relatórios">
      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="mes">Mês</label>
        <select id="mes" className="input" value={mes} onChange={(e) => setMes(e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>
      <div className="grid2">
        <div className="card"><Stat label="Vendido no mês" value={brl(vendido)} /></div>
        <div className="card"><Stat label="Peças vendidas" value={doMes.length} /></div>
        <div className="card"><Stat label="A receber em aberto" value={brl(emAberto)} /></div>
        <div className="card"><Stat label="Comissões do mês" value={brl(comissoes)} /></div>
      </div>
      <section className="card">
        <div className="chart-head"><h2>Ranking de revendedoras · {monthLabel(mes).toLowerCase()}</h2></div>
        {ranking.length === 0 ? (
          <p className="row__meta">Nenhuma venda no mês.</p>
        ) : (
          <div className="rank">
            {ranking.map((r, k) => (
              <div key={r.id} className="rank__row">
                <span className={`rank__pos rank__pos--${k + 1}`} aria-label={`${k + 1}º lugar`}>{k + 1}º</span>
                <div className="row__main">
                  <span className="row__title">{r.name}</span>
                  <span className="row__meta">{r.qty} {r.qty === 1 ? 'peça vendida' : 'peças vendidas'}</span>
                </div>
                <b style={{ fontSize: 14 }}>{brl(r.value)}</b>
              </div>
            ))}
          </div>
        )}
      </section>
      <PieBars title="Vendas por mês" items={porMes} />
      <PieBars title="Vendas por revendedora" items={porRev} />
      <PieBars title="Onde estão as peças" items={onde} money={false} />
      <Link to={`/relatorios/abc?mes=${mes}`} className="btn btn--primary">Ver curva ABC das peças</Link>
    </Screen>
  );
}
