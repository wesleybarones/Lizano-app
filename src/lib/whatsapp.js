import { normalizePhone } from './format';

// Celular da revendedora (perfil ou login por celular), só dígitos com 55
export function phoneOf(p) {
  if (!p) return '';
  if (p.phone) return p.phone;
  const login = String(p.login || '');
  return login.includes('@') ? '' : normalizePhone(login);
}
export const waLink = (phone, text) =>
  phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
