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
    }
    function step(t) {
      raf = requestAnimationFrame(step);
      if (t - last < 33) return; // ~30 fps
      const dt = Math.min(0.1, (t - last) / 1000 || 0.033);
      last = t;
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
