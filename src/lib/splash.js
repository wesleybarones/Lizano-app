// Tira a abertura (definida no index.html) quando o app está pronto
// e o tempo mínimo da animação já passou.
let done = false;
export function hideSplash() {
  if (done) return;
  done = true;
  const el = document.getElementById('splash');
  if (!el) return;
  const wait = Math.max(0, (window.__splashMin || 0) - Date.now());
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 700);
  }, wait);
}
