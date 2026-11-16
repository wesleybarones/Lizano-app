/* Aparência do app: 'auto' (segue o celular), 'light' ou 'dark'. Guardada neste aparelho. */
const KEY = 'lz-theme';
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

export function getThemePref() {
  try { return localStorage.getItem(KEY) || 'auto'; } catch { return 'auto'; }
}
function resolve(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return mq?.matches ? 'light' : 'dark';
}
export function applyTheme(pref = getThemePref()) {
  const t = resolve(pref);
  if (t === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
}
export function setThemePref(pref) {
  try { localStorage.setItem(KEY, pref); } catch { /* sem armazenamento: vale só agora */ }
  applyTheme(pref);
}
// no modo automático, acompanha a troca do celular (ex.: escurece à noite)
mq?.addEventListener?.('change', () => { if (getThemePref() === 'auto') applyTheme(); });
