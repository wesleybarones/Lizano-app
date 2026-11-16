import { useRef, useState } from 'react';

/*
 * Toque longo: segurar por `ms` (padrão 1 s) chama onLong. Um toque curto
 * segue normal (abre o link). Arrastar o dedo (rolar a lista) cancela.
 */
export default function useLongPress(onLong, ms = 1000) {
  const timer = useRef(null);
  const start = useRef(null);
  const fired = useRef(false);
  const [pressing, setPressing] = useState(false);

  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = null;
    setPressing(false);
  };
  return {
    pressing,
    bind: {
      onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        fired.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        setPressing(true);
        timer.current = setTimeout(() => {
          fired.current = true;
          setPressing(false);
          if (navigator.vibrate) navigator.vibrate(30);
          onLong();
        }, ms);
      },
      onPointerMove(e) {
        if (!start.current || !timer.current) return;
        if (Math.abs(e.clientX - start.current.x) > 10 || Math.abs(e.clientY - start.current.y) > 10) cancel();
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onTouchEnd(e) {
        // depois do toque longo, soltar o dedo não gera clique (nem abre a peça nem fecha a folha)
        if (fired.current && e.cancelable) e.preventDefault();
      },
      onContextMenu(e) {
        e.preventDefault(); // sem o menu do navegador ao segurar
      },
      onClick(e) {
        if (fired.current) {
          e.preventDefault(); // toque longo não abre a peça
          e.stopPropagation();
          fired.current = false;
        }
      },
    },
  };
}
