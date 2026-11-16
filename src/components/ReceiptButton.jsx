import { useState } from 'react';
import { receiptPdf, shareOrDownload } from '../lib/pdf';
import { brl } from '../lib/format';
import { kitTotals } from '../lib/calc';

/* Gera o comprovante do acerto em PDF e abre o "compartilhar" (WhatsApp) */
export default function ReceiptButton({ kit, brand, className = 'btn btn--ghost', label = 'Comprovante do acerto (PDF)' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true);
    setErr('');
    try {
      const blob = await receiptPdf(kit, brand);
      const t = kitTotals(kit);
      await shareOrDownload(blob, `Acerto-maleta-${kit.number}.pdf`,
        `Comprovante do acerto da maleta nº ${kit.number} (${kit.reseller?.name || ''}): ${brl(t.receivable)}.`);
    } catch (e) {
      setErr('Não foi possível gerar o PDF.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={go} disabled={busy}>{busy ? 'Gerando PDF…' : label}</button>
      {err && <span className="row__meta" role="alert">{err}</span>}
    </>
  );
}
