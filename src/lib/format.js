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

// Login: celular (só números) vira um e-mail interno; e-mail fica como está.
export function loginToEmail(login) {
  const v = String(login || '').trim().toLowerCase();
  if (v.includes('@')) return v;
  const digits = v.replace(/\D/g, '');
  return digits ? `${digits}@celular.barones.app` : '';
}
export const initials = (name) =>
  String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
