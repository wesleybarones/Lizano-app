const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (v) => brlFmt.format(Number(v) || 0);
export const pct = (v) => `${(Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export function dateBR(d) {
  if (!d) return '';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}
export const shortDate = (d) => dateBR(d).slice(0, 5);
export const today = () => new Date().toISOString().slice(0, 10);
export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const monthKey = (iso) => String(iso).slice(0, 7);
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
