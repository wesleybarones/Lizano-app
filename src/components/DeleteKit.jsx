import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { kitTotals } from '../lib/calc';
import { brl } from '../lib/format';
import { ErrorMsg } from './ui';

/* Confirmação para excluir uma maleta (só o dono) */
export default function DeleteKit({ kit, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const openedAt = useRef(Date.now());
  const t = kitTotals(kit);
  const open = kit.status === 'open';
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await api.kits.remove(kit.id);
      onDone();
    } catch (e) {
      setError(e.message || 'Não foi possível excluir.');
      setBusy(false);
    }
  }
  return createPortal(
    <div className="sheet-bg" onClick={() => !busy && Date.now() - openedAt.current > 600 && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="delk-title" onClick={(e) => e.stopPropagation()}>
        <div className="row__main">
          <b id="delk-title" style={{ fontSize: 17 }}>Excluir a maleta nº {kit.number}?</b>
          <span className="row__meta">
            {kit.reseller?.name} · {t.count} {t.count === 1 ? 'peça' : 'peças'} · {t.soldCount} {t.soldCount === 1 ? 'vendida' : 'vendidas'} ({brl(t.soldTotal)})
          </span>
        </div>
        <ul className="sheet__list">
          {open ? (
            <>
              <li>As {t.leftCount} peças que não foram vendidas voltam para o estoque.</li>
              {t.soldCount > 0 && <li><b>As {t.soldCount} vendas marcadas nesta maleta serão apagadas.</b></li>}
            </>
          ) : (
            <li><b>O acerto desta maleta sai do histórico e dos relatórios{kit.paid_at ? '' : ', inclusive o valor a receber'}.</b></li>
          )}
          <li>Não dá para desfazer.</li>
        </ul>
        <ErrorMsg>{error}</ErrorMsg>
        <div className="btns">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy} autoFocus>Cancelar</button>
          <button type="button" className="btn btn--delete" onClick={confirm} disabled={busy}>{busy ? 'Excluindo…' : 'Excluir maleta'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
