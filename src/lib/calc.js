/*
 * Regras de cálculo (proposta registrada no documento do projeto; o ADM
 * define os percentuais e valores de cada revendedora).
 *  vendido   = soma do preço das peças marcadas como vendidas
 *  comissão  = % da revendedora × vendido
 *  bônus     = valor fixo quando a meta é atingida (meta > 0). A meta é
 *              por quantidade de peças vendidas (padrão) ou por valor vendido;
 *              o ADM escolhe para cada revendedora.
 *  a receber = vendido − comissão − bônus + ajuste do ADM
 */
import { monthKey } from './format';

// Preço que vale para o item: congelado no acerto ou o preço atual da peça
export function itemPrice(item) {
  return Number(item.price ?? item.piece?.price ?? 0);
}

/*
 * Regras da revendedora que valem para a maleta. Até o acerto valem as atuais
 * do perfil; no acerto são copiadas para a maleta e ficam congeladas.
 * Regra nova? Some aqui E na função settle_kit do banco (supabase/migrations).
 */
export const RULE_FIELDS = ['commission_pct', 'bonus_amount', 'goal_amount', 'goal_type'];
export const pickRules = (src) => Object.fromEntries(RULE_FIELDS.map((f) => [f, src?.[f] ?? null]));
export const kitRules = (kit, reseller) =>
  kit.status === 'settled' ? pickRules(kit) : pickRules(reseller || kit.reseller);

// Vendas contam no mês (horário de Brasília) em que a peça foi marcada como vendida
export function soldItems(kits) {
  return kits.flatMap((k) => k.items.filter((i) => i.sold && i.sold_at).map((i) => ({ ...i, kit: k, month: monthKey(i.sold_at) })));
}

export function kitTotals(kit, reseller) {
  const items = kit.items || [];
  const rules = kitRules(kit, reseller);
  const sold = items.filter((i) => i.sold);
  const total = items.reduce((s, i) => s + itemPrice(i), 0);
  const soldTotal = sold.reduce((s, i) => s + itemPrice(i), 0);
  const commissionPct = Number(rules.commission_pct) || 0;
  const commission = round2((soldTotal * commissionPct) / 100);
  const goal = Number(rules.goal_amount) || 0;
  const goalType = rules.goal_type === 'value' ? 'value' : 'pieces';
  const goalDone = goalType === 'value' ? soldTotal : sold.length; // quanto já andou na meta
  const goalHit = goal > 0 && goalDone >= goal;
  const bonus = goalHit ? Number(rules.bonus_amount) || 0 : 0;
  const adjust = Number(kit.adjust_amount) || 0;
  return {
    count: items.length,
    soldCount: sold.length,
    leftCount: items.length - sold.length,
    total: round2(total),
    soldTotal: round2(soldTotal),
    returnedTotal: round2(total - soldTotal),
    commissionPct,
    commission,
    goal,
    goalType,
    goalDone,
    goalHit,
    goalProgress: goal > 0 ? Math.min(1, goalDone / goal) : 0,
    bonusAmount: Number(rules.bonus_amount) || 0,
    bonus,
    adjust,
    receivable: round2(soldTotal - commission - bonus + adjust),
  };
}

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Curva ABC por faturamento: A até 80% do acumulado, B até 95%, C o resto.
export function abcCurve(rows) {
  const sorted = [...rows].filter((r) => r.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  const total = sorted.reduce((s, r) => s + r.revenue, 0) || 1;
  let acc = 0;
  return sorted.map((r) => {
    const before = acc / total;
    acc += r.revenue;
    const cum = acc / total;
    const cls = before < 0.8 ? 'A' : before < 0.95 ? 'B' : 'C';
    return { ...r, share: r.revenue / total, cum, cls };
  });
}
