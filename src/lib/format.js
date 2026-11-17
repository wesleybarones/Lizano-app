const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (v) => brlFmt.format(Number(v) || 0);
export const pct = (v) => `${(Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/*
 * Datas sempre no horário de Brasília. Sem isso, depois das 21h o app já
 * achava que era o dia seguinte (o relógio do banco e do JavaScript é UTC).
 */
const TZ = 'America/Sao_Paulo';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

// '2026-11-17' fica igual; data e hora ('2026-11-18T01:30:00Z') vira o dia em Brasília ('2026-11-17')
export function localDay(v) {
  if (!v) return '';
  const s = String(v);
  if (s.length <= 10) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : dayFmt.format(d);
}

export function dateBR(d) {
  const v = localDay(d);
  if (!v) return '';
  const [y, m, day] = v.split('-');
  return `${day}/${m}/${y}`;
}
export const shortDate = (d) => dateBR(d).slice(0, 5);
export const today = () => localDay(new Date().toISOString());
export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const monthKey = (iso) => localDay(iso).slice(0, 7);
// '2026-01' + (-2) -> '2025-11'
export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}
export const monthLabel = (key) => `${MONTHS[Number(key.slice(5, 7)) - 1]} de ${key.slice(0, 4)}`;

// Celular em qualquer formato -> só dígitos com 55 (Brasil) na frente
export function normalizePhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}
export const isEmail = (v) => String(v || '').includes('@');

// Login: e-mail fica como está; celular sem conta de e-mail vira um e-mail interno.
export function loginToEmail(login) {
  const v = String(login || '').trim().toLowerCase();
  if (isEmail(v)) return v;
  const digits = normalizePhone(v);
  return digits ? `${digits}@celular.barones.app` : '';
}
export const initials = (name) =>
  String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

// Meta do bônus: "10 peças" ou "R$ 1.000,00"
export function goalText(type, v) {
  if (type === 'value') return brl(v);
  const n = Number(v) || 0;
  return `${n} ${n === 1 ? 'peça' : 'peças'}`;
}

// Categorias das peças
export const CATEGORIES = [
  { id: 'brinco', label: 'Brincos', one: 'Brinco' },
  { id: 'colar', label: 'Colares', one: 'Colar' },
  { id: 'pulseira', label: 'Pulseiras', one: 'Pulseira' },
  { id: 'anel', label: 'Anéis', one: 'Anel' },
  { id: 'outro', label: 'Outros', one: 'Outro' },
];
export const catOne = (id) => CATEGORIES.find((c) => c.id === id)?.one || 'Outro';
// Sugere a categoria pelo nome da peça (o dono pode trocar)
export function guessCategory(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('brinco')) return 'brinco';
  if (/colar|gargantilha|corrente/.test(n)) return 'colar';
  if (/pulseira|bracelete/.test(n)) return 'pulseira';
  if (/\banel\b|an[eé]is/.test(n)) return 'anel';
  return '';
}
