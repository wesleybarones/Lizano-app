import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { Empty, Loading, PieBars, Screen } from '../../components/ui';
import { abcCurve, itemPrice } from '../../lib/calc';
import { brl, monthKey, monthLabel, today } from '../../lib/format';
import { soldItems } from './Relatorios';

const CLS = {
  A: { color: '#232D42', text: '#FBF8F3' },
  B: { color: '#A8864A', text: '#232D42' },
  C: { color: '#E2C998', text: '#232D42' },
};

export default function CurvaABC() {
  const { kits, loaded } = useStore();
  const [params] = useSearchParams();
  const mes = params.get('mes') || monthKey(today());
  const rows = useMemo(() => {
    const m = {};
    for (const i of soldItems(kits).filter((x) => x.month === mes)) {
      const r = (m[i.piece_id] ||= { id: i.piece_id, name: i.piece?.name, code: i.piece?.code, qty: 0, revenue: 0 });
      r.qty += 1;
      r.revenue += itemPrice(i);
    }
    return abcCurve(Object.values(m));
  }, [kits, mes]);
  if (!loaded) return <Screen title="Curva ABC" back="/relatorios"><Loading /></Screen>;

  const classes = ['A', 'B', 'C'].map((c) => {
    const rs = rows.filter((r) => r.cls === c);
    return {
      label: `Classe ${c}`,
      value: Math.round(rs.reduce((s, r) => s + r.revenue, 0) * 100) / 100,
      detail: `${rs.length} ${rs.length === 1 ? 'peça' : 'peças'} · ${brl(rs.reduce((s, r) => s + r.revenue, 0))}`,
      color: CLS[c].color,
    };
  });
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const top = rows.slice(0, 12);
  const curva = (
    <div className="stack" style={{ gap: 8 }}>
      <span className="row__meta" style={{ fontSize: 11 }}>Barras = faturamento de cada peça · linha = % acumulado · tracejado = 80%</span>
      <svg viewBox={`0 0 ${top.length * 40} 190`} role="img" style={{ width: '100%', height: 190 }}
        aria-label={`Curva ABC: ${top.map((r) => `${r.code} ${Math.round(r.cum * 100)}%`).join(', ')}`}>
        <line x1="0" x2={top.length * 40} y1={190 - 0.8 * 180} y2={190 - 0.8 * 180} stroke="#9A9EA6" strokeDasharray="4 4" />
        {top.map((r, k) => (
          <rect key={r.id} x={k * 40 + 6} width="28" y={190 - (r.revenue / max) * 150} height={(r.revenue / max) * 150} rx="4" fill={CLS[r.cls].color} />
        ))}
        <polyline fill="none" stroke="#6B6F78" strokeWidth="2.5" strokeLinejoin="round"
          points={top.map((r, k) => `${k * 40 + 20},${190 - r.cum * 180}`).join(' ')} />
        {top.map((r, k) => <circle key={r.id} cx={k * 40 + 20} cy={190 - r.cum * 180} r="4" fill="#FBF8F3" stroke="#6B6F78" strokeWidth="2.5" />)}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))`, gap: 0 }}>
        {top.map((r) => <span key={r.id} style={{ fontSize: 9, textAlign: 'center', color: '#4F535C', overflow: 'hidden' }}>{r.code}</span>)}
      </div>
    </div>
  );

  return (
    <Screen title="Curva ABC" sub={`Peças por faturamento · ${monthLabel(mes).toLowerCase()}`} back="/relatorios">
      {rows.length === 0 ? (
        <Empty>Nenhuma venda neste mês.</Empty>
      ) : (
        <>
          <PieBars title="Faturamento por classe" items={classes} altLabel="Curva" alt={curva} />
          <div className="card card--list">
            <div className="row" style={{ minHeight: 34, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 30px 84px 44px', fontSize: 11, color: 'var(--ink-2)' }}>
              <span>Peça</span><span>Cl.</span><span style={{ textAlign: 'right' }}>Faturou</span><span style={{ textAlign: 'right' }}>Acum.</span>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 30px 84px 44px', minHeight: 46 }}>
                <div className="row__main"><span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span><span className="row__meta" style={{ fontSize: 11 }}>{r.qty} vendidas</span></div>
                <span style={{ width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: CLS[r.cls].color, color: CLS[r.cls].text }}>{r.cls}</span>
                <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{brl(r.revenue)}</span>
                <span style={{ fontSize: 12, textAlign: 'right' }}>{Math.round(r.cum * 100)}%</span>
              </div>
            ))}
          </div>
          <p className="note">Classe A: peças que somam até 80% do faturamento. Priorize essas nas maletas e na reposição.</p>
        </>
      )}
    </Screen>
  );
}
