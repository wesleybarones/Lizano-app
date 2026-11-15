import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';
import { Loading, PieBars, Screen, Stat, CHART_COLORS } from '../../components/ui';
import { itemPrice, kitTotals } from '../../lib/calc';
import { brl, monthKey, monthLabel, MONTHS, today } from '../../lib/format';

/* Vendas contam no mês em que a peça foi marcada como vendida */
export function soldItems(kits) {
  return kits.flatMap((k) => k.items.filter((i) => i.sold && i.sold_at).map((i) => ({ ...i, kit: k, month: monthKey(i.sold_at) })));
}

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
  const comissoes = doMes.reduce((s, i) => {
    const pct = i.kit.status === 'settled' ? i.kit.commission_pct : i.kit.reseller?.commission_pct;
    return s + (itemPrice(i) * (Number(pct) || 0)) / 100;
  }, 0);
  const emAberto = kits.filter((k) => k.status === 'settled' && !k.paid_at).reduce((s, k) => s + kitTotals(k).receivable, 0);

  // últimos 6 meses até o mês escolhido
  const ultimos = [];
  for (let n = 5; n >= 0; n--) {
    const d = new Date(`${mes}-15T12:00:00`);
    d.setMonth(d.getMonth() - n);
    ultimos.push(d.toISOString().slice(0, 7));
  }
  const porMes = ultimos.map((m, k) => ({
    label: MONTHS[Number(m.slice(5)) - 1],
    value: Math.round(all.filter((i) => i.month === m).reduce((s, i) => s + itemPrice(i), 0) * 100) / 100,
    color: ['#EFE3C8', '#E2C998', '#C9A869', '#A8864A', '#6B6F78', '#232D42'][k],
  }));
  const porRev = resellers
    .map((r) => ({ label: r.name, value: doMes.filter((i) => i.kit.reseller_id === r.id).reduce((s, i) => s + itemPrice(i), 0) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((x, k) => ({ ...x, color: CHART_COLORS[k % CHART_COLORS.length] }));
  const comRev = kits.filter((k) => k.status === 'open').reduce((s, k) => s + k.items.filter((i) => !i.sold).length, 0);
  const estoque = pieces.reduce((s, p) => s + Math.max(0, p.stock_qty), 0);
  const onde = [
    { label: 'Com revendedoras', value: comRev, color: '#232D42' },
    { label: 'No estoque', value: estoque, color: '#A8864A' },
    { label: 'Vendidas no mês', value: doMes.length, color: '#C9A869' },
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
      <PieBars title="Vendas por mês" items={porMes} />
      <PieBars title="Vendas por revendedora" items={porRev} />
      <PieBars title="Onde estão as peças" items={onde} money={false} />
      <Link to={`/relatorios/abc?mes=${mes}`} className="btn btn--primary">Ver curva ABC das peças</Link>
    </Screen>
  );
}
