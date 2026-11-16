import { useState } from 'react';
import { ErrorMsg } from './ui';

/* Dois botões: câmera do celular e galeria. Converte e reduz a foto antes de enviar. */
export default function PhotoPicker({ label, hasPhoto, onPick, onRemove }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function handle(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher a mesma foto de novo
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onPick(file);
    } catch (err) {
      setError(err.message || 'Não foi possível enviar a foto.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="field" style={{ flex: 1, minWidth: 0 }}>
      <span className="row__meta">{label}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label className="file-btn">
          Tirar foto
          <input type="file" accept="image/*" capture="environment" onChange={handle} disabled={busy} aria-label={`${label}: tirar foto com a câmera`} />
        </label>
        <label className="file-btn">
          Galeria
          <input type="file" accept="image/*" onChange={handle} disabled={busy} aria-label={`${label}: escolher da galeria`} />
        </label>
      </div>
      {busy && <span className="row__meta">Preparando e enviando a foto…</span>}
      {hasPhoto && onRemove && !busy && (
        <button type="button" className="btn btn--link" style={{ color: 'var(--gold-dark)', alignSelf: 'flex-start', padding: 0, minHeight: 32 }} onClick={onRemove}>
          Remover foto
        </button>
      )}
      <ErrorMsg>{error}</ErrorMsg>
    </div>
  );
}
