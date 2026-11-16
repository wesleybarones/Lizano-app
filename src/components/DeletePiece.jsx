import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { ErrorMsg, Thumb } from './ui';
import { brl } from '../lib/format';

/* Folha de confirmação para excluir uma peça */
export default function DeletePiece({ piece, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const openedAt = useRef(Date.now());
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      const r = await api.pieces.remove(piece.id);
      onDone(r);
    } catch (e) {
      setError(e.message || 'Não foi possível excluir.');
      setBusy(false);
    }
  }
  return createPortal(
    <div className="sheet-bg" onClick={() => !busy && Date.now() - openedAt.current > 600 && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="del-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__piece">
          <Thumb piece={piece} />
          <div className="row__main">
            <b id="del-title">Excluir esta peça?</b>
            <span className="row__meta">{piece.name} · {piece.code} · {brl(piece.price)}</span>
          </div>
        </div>
        <p className="row__meta">Ela sai da lista de peças. Acertos antigos continuam com o nome e o preço dela.</p>
        <ErrorMsg>{error}</ErrorMsg>
        <div className="btns">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy} autoFocus>Cancelar</button>
          <button type="button" className="btn btn--delete" onClick={confirm} disabled={busy}>{busy ? 'Excluindo…' : 'Excluir'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
