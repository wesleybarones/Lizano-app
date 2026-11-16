import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { brl, CATEGORIES, initials, pct } from '../lib/format';

const ICONS = {
  home: 'M3 11l9-7 9 7v9h-6v-6H9v6H3z',
  gem: 'M6 3h12l4 6-10 12L2 9zM2 9h20',
  team: 'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.7 2.5 3 5.2',
  case: 'M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V4h6v3M3 13h18',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  tag: 'M20 12l-8 8-9-9V3h8zM7.5 7.5h.01',
  coins: 'M12 3a8 3 0 1 0 0 .01M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  check: 'M5 12.5l4.5 4.5L19 7',
  back: 'M15 5l-7 7 7 7',
  plus: 'M12 5v14M5 12h14',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};

export function Icon({ name, size = 20, width = 1.8 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function Monogram({ size = 40 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.6">
      <path d="M50.3 2 L3.2 96.8 L58 96.8" />
      <path d="M25.1 85.2 L56.1 22.6 L98 98" />
    </svg>
  );
}

const ADMIN_TABS = [
  ['/', 'Início', 'home'],
  ['/pecas', 'Peças', 'gem'],
  ['/equipe', 'Equipe', 'team'],
  ['/maletas', 'Maletas', 'case'],
  ['/relatorios', 'Relatórios', 'chart'],
];
const REV_TABS = [
  ['/', 'Maleta', 'case'],
  ['/vender', 'Vender', 'tag'],
  ['/numeros', 'Meus números', 'coins'],
  ['/historico', 'Histórico', 'clock'],
];

export function Screen({ title, sub, back, action, children }) {
  const { me } = useStore();
  const admin = me?.role === 'admin';
  const first = me?.name?.split(' ')[0] || '';
  const eyebrow = admin ? `${me?.brand_name || 'Lizano'} · Painel do dono` : `${me?.brand_name || 'Lizano'} · Olá, ${first}`;
  const tabs = admin ? ADMIN_TABS : REV_TABS;
  const swipe = useTabSwipe(tabs);
  const loc = useLocation();
  const enter = loc.state?.swipe; // 'left' | 'right': de que lado a tela entra
  return (
    <div className="app" {...swipe} data-enter={enter || undefined}>
      <header className="top">
        {back && (
          <Link to={back} className="back">
            <Icon name="back" size={18} /> Voltar
          </Link>
        )}
        <div className="top__row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="title">{title}</h1>
            {sub && <span className="sub">{sub}</span>}
          </div>
          {action}
          <ProfileButton me={me} admin={admin} />
        </div>
      </header>
      <main className="main">{children}</main>
      <nav className="nav" aria-label={admin ? 'Menu do painel' : 'Menu da revendedora'}>
        <div className="nav__inner">
          {tabs.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/*
 * Deslizar o dedo para o lado troca de aba do menu de baixo.
 * Ignora: gesto mais vertical que horizontal (rolagem), começo na borda da tela
 * (gesto de voltar do iPhone), faixas que rolam para o lado, campos e janelas.
 */
function useTabSwipe(tabs) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const start = useRef(null);
  const current = tabs.findIndex(([to]) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)));
  return {
    onTouchStart(e) {
      start.current = null;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const el = e.target;
      if (t.clientX < 24 || t.clientX > window.innerWidth - 24) return;
      if (el.closest?.('.chips, .toggle, input, textarea, select, .lightbox, .sheet-bg, .pick, .qty, [data-noswipe]')) return;
      start.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    },
    onTouchEnd(e) {
      const s = start.current;
      start.current = null;
      if (!s || current < 0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const fast = Date.now() - s.time < 700;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || !fast) return;
      const next = current + (dx < 0 ? 1 : -1);
      if (next < 0 || next >= tabs.length) return;
      nav(tabs[next][0], { state: { swipe: dx < 0 ? 'right' : 'left' } });
    },
  };
}

/* Botão do perfil no topo: logo da empresa (dono) ou iniciais (revendedora) */
function ProfileButton({ me, admin }) {
  const logo = admin && me?.brand_logo;
  return (
    <Link to="/perfil" className="profile-btn" aria-label={admin ? 'Perfil da empresa e sair' : 'Meu perfil e sair'}>
      {logo ? <img src={logo} alt="" /> : <span>{initials(admin ? me?.brand_name : me?.name)}</span>}
    </Link>
  );
}

export function Stat({ label, value, xl }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className={`stat__value ${xl ? 'stat__value--xl' : ''}`}>{value}</span>
    </div>
  );
}

/* Miniatura: tocar abre a foto grande */
export function Thumb({ piece }) {
  const [open, setOpen] = useState(false);
  if (!piece?.photo_url) return <div className="thumb" aria-hidden="true">foto</div>;
  const show = (e) => {
    e.preventDefault(); // dentro de um link/botão: não navega nem seleciona
    e.stopPropagation();
    setOpen(true);
  };
  return (
    <>
      {/* span em vez de button: a miniatura fica dentro de links e botões da lista */}
      <span role="button" tabIndex={0} className="thumb thumb--btn" onClick={show}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && show(e)}
        aria-label={`Ver foto de ${piece.name || 'peça'} em tamanho grande`}>
        <img src={piece.photo_url} alt="" loading="lazy" />
      </span>
      {open && <Lightbox src={piece.photo_url} title={piece.name} onClose={() => setOpen(false)} />}
    </>
  );
}

export function Lightbox({ src, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={title || 'Foto da peça'} onClick={(e) => { stop(e); onClose(); }}>
      <button type="button" className="lightbox__close" aria-label="Fechar foto" onClick={(e) => { stop(e); onClose(); }} autoFocus>✕</button>
      <img src={src} alt={title || 'Foto da peça'} onClick={stop} />
      {title && <p className="lightbox__title">{title}</p>}
    </div>,
    document.body,
  );
}

/* Filtro por categoria: Todas · Brincos · Colares · Pulseiras · Outros */
export function CategoryChips({ value, onChange, pieces }) {
  const count = (id) => pieces.filter((p) => (p.category || 'outro') === id).length;
  const opts = [{ id: '', label: 'Todas', n: pieces.length }, ...CATEGORIES.map((c) => ({ ...c, n: count(c.id) }))].filter(
    (o) => o.id === '' || o.n > 0 || o.id === value,
  );
  return (
    <div className="chips" role="group" aria-label="Filtrar por categoria">
      {opts.map((o) => (
        <button key={o.id || 'all'} type="button" className="chip" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label} <span>{o.n}</span>
        </button>
      ))}
    </div>
  );
}
export const byCategory = (cat) => (p) => !cat || (p.category || 'outro') === cat;

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Loading() {
  return <div className="loading">Carregando…</div>;
}

/* Paleta dos gráficos: do azul-marinho ao dourado claro */
export const CHART_COLORS = ['#232D42', '#A8864A', '#C9A869', '#E2C998', '#6B6F78', '#1A2232', '#EFE3C8'];

/* Gráfico que abre em pizza e troca para barras (pedido do Wesley) */
export function PieBars({ title, items, money = true, altLabel = 'Barras', alt }) {
  const [mode, setMode] = useState('pie');
  const total = items.reduce((s, i) => s + i.value, 0);
  const max = Math.max(1, ...items.map((i) => i.value));
  let acc = 0;
  const stops = items
    .map((i, k) => {
      const from = (acc / (total || 1)) * 100;
      acc += i.value;
      const to = (acc / (total || 1)) * 100;
      return `${i.color || CHART_COLORS[k % CHART_COLORS.length]} ${from}% ${to}%`;
    })
    .join(', ');
  const fmt = (v) => (money ? brl(v) : `${v} ${v === 1 ? 'peça' : 'peças'}`);
  const desc = items.map((i) => `${i.label}: ${fmt(i.value)}`).join('; ');
  return (
    <section className="card">
      <div className="chart-head">
        <h2>{title}</h2>
        <div className="toggle" role="group" aria-label="Tipo de gráfico">
          <button type="button" aria-pressed={mode === 'pie'} onClick={() => setMode('pie')}>Pizza</button>
          <button type="button" aria-pressed={mode === 'alt'} onClick={() => setMode('alt')}>{altLabel}</button>
        </div>
      </div>
      {total === 0 ? (
        <p className="row__meta">Sem dados no período.</p>
      ) : mode === 'pie' ? (
        <div className="pie-wrap">
          <div className="pie" role="img" aria-label={`Pizza. ${desc}`} style={{ background: `conic-gradient(${stops})` }} />
          <div className="legend">
            {items.map((i, k) => (
              <div className="legend__row" key={i.label}>
                <span className="swatch" style={{ background: i.color || CHART_COLORS[k % CHART_COLORS.length] }} />
                <span className="legend__name">
                  <b>{i.label}</b>
                  <span>{i.detail || fmt(i.value)}</span>
                </span>
                <span className="legend__pct">{pct(Math.round((i.value / total) * 100))}</span>
              </div>
            ))}
          </div>
        </div>
      ) : alt ? (
        alt
      ) : (
        <div className="bars">
          {items.map((i, k) => (
            <div key={i.label}>
              <div className="bar__top">
                <span>{i.label}</span>
                <b>{fmt(i.value)}</b>
              </div>
              <div className="bar__track">
                <div className="bar__fill" style={{ width: `${(i.value / max) * 100}%`, background: i.color || CHART_COLORS[k % CHART_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ErrorMsg({ children }) {
  return children ? <div className="error" role="alert">{children}</div> : null;
}
