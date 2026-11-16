import { useEffect, useRef } from 'react';

/*
 * Partículas douradas ao fundo: pontinhos de luz que flutuam devagar,
 * em direções aleatórias, quase imperceptíveis. Ficam atrás de todo o conteúdo.
 * Leve: ~30 quadros/s, pausa com o app em segundo plano e respeita "reduzir movimento".
 */
export default function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, parts = [];
    let star = null, nextStar = 0; // estrela cadente de vez em quando

    const rand = (a, b) => a + Math.random() * (b - a);
    const make = (anywhere = true) => {
      const ang = rand(0, Math.PI * 2);
      const speed = rand(3, 11); // px por segundo
      return {
        x: rand(0, w), y: anywhere ? rand(0, h) : h + 4,
        r: Math.random() < 0.12 ? rand(1.4, 2.1) : rand(0.5, 1.2),
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed - 2, // leve tendência a subir
        a: rand(0.1, 0.42), tw: rand(0.4, 1.3), ph: rand(0, Math.PI * 2),
        warm: Math.random() < 0.7,
      };
    };
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, Math.max(28, (w * h) / 11000)));
      parts = Array.from({ length: n }, () => make());
    }
    function launchStar(t) {
      // nasce na parte de cima, cruza na diagonal (para a esquerda ou para a direita)
      const dir = Math.random() < 0.5 ? 1 : -1;
      const ang = rand(0.32, 0.6); // inclinação em radianos
      const dist = rand(0.55, 0.85) * Math.max(w, h);
      star = {
        x0: dir > 0 ? rand(-0.05, 0.55) * w : rand(0.45, 1.05) * w, y0: rand(0.02, 0.35) * h,
        dx: Math.cos(ang) * dist * dir, dy: Math.sin(ang) * dist,
        t0: t, dur: rand(900, 1300), tail: rand(120, 190),
      };
    }
    function drawStar(t) {
      const k = (t - star.t0) / star.dur;
      if (k >= 1) { star = null; return; }
      const e = 1 - Math.pow(1 - k, 2); // começa rápida e desacelera
      const len = Math.hypot(star.dx, star.dy);
      const ux = star.dx / len, uy = star.dy / len;
      const hx = star.x0 + star.dx * e, hy = star.y0 + star.dy * e;
      const tail = star.tail * (0.4 + 0.6 * Math.sin(Math.min(1, k * 1.6) * Math.PI / 2));
      const fade = k < 0.12 ? k / 0.12 : k > 0.7 ? (1 - k) / 0.3 : 1;
      const tx = hx - ux * tail, ty = hy - uy * tail;
      const g = ctx.createLinearGradient(hx, hy, tx, ty);
      g.addColorStop(0, `rgba(255, 248, 230, ${0.85 * fade})`);
      g.addColorStop(0.25, `rgba(236, 214, 170, ${0.55 * fade})`);
      g.addColorStop(1, 'rgba(226, 201, 152, 0)');
      ctx.save();
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
      halo.addColorStop(0, `rgba(255, 246, 226, ${0.9 * fade})`);
      halo.addColorStop(1, 'rgba(255, 246, 226, 0)');
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const tw = 0.55 + 0.45 * Math.sin(t / 1000 * p.tw + p.ph); // cintila devagar
        const alpha = p.a * tw;
        ctx.fillStyle = p.warm ? `rgba(226, 201, 152, ${alpha})` : `rgba(255, 246, 226, ${alpha})`;
        if (p.r > 1.3) { // as maiores ganham um halo suave
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(255, 240, 210, ${alpha * 0.5})`);
          g.addColorStop(1, 'rgba(255, 240, 210, 0)');
          ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      if (star) drawStar(t);
    }
    function step(t) {
      raf = requestAnimationFrame(step);
      if (t - last < 33) return; // ~30 fps
      const dt = Math.min(0.1, (t - last) / 1000 || 0.033);
      last = t;
      if (!nextStar) nextStar = t + rand(6000, 14000);
      if (!star && t >= nextStar) { launchStar(t); nextStar = t + rand(14000, 30000); }
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx += rand(-1, 1) * dt * 2; p.vy += rand(-1, 1) * dt * 2; // muda de rumo aos poucos
        if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) parts[i] = make(true);
      }
      draw(t);
    }
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) { last = 0; raf = requestAnimationFrame(step); }
    };
    resize();
    draw(0);
    window.__lzStar = () => { nextStar = 1; }; // usado só para testar
    if (!reduce) raf = requestAnimationFrame(step);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return <canvas ref={ref} className="particles" aria-hidden="true" />;
}
