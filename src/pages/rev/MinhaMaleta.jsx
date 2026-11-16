import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store';
import { CategoryChips, Empty, ErrorMsg, Loading, Screen, Stat, Thumb } from '../../components/ui';
import WaButton from '../../components/WaButton';
import { kitTotals } from '../../lib/calc';
import { addDays, brl, catOne, dateBR, shortDate, today } from '../../lib/format';
import { shareOrDownload, warrantyPdf } from '../../lib/pdf';
import { waLink } from '../../lib/whatsapp';
import { currentKit } from './common';

const BRAND_WA = '5521982271402';

export default function MinhaMaleta() {
  const { kits, loaded, me } = useStore();
  const loc = useLocation();
  const [cat, setCat] = useState('');
  const [garantia, setGarantia] = useState(null);
  const k = currentKit(kits);
  if (!loaded) return <Screen title="Minha maleta"><Loading /></Screen>;
  if (!k) return <Screen title="Minha maleta"><Empty>Você não tem maleta no momento. Quando a Lizano enviar, ela aparece aqui.</Empty></Screen>;
  const t = kitTotals(k);
  const brand = me?.brand_name || 'Lizano';
  const hoje = today();
  const filtro = (i) => !cat || (i.piece?.category || 'outro') === cat;

  // peças com ela, agrupadas por modelo
  const comVoce = Object.values(
    k.items.filter((i) => !i.sold).reduce((m, i) => {
      (m[i.piece_id] ||= { piece: i.piece, qty: 0, first: i }).qty += 1;
      return m;
    }, {}),
  ).filter((g) => filtro(g.first)).sort((a, b) => (a.piece?.name || '').localeCompare(b.piece?.name || ''));
  const vendidas = k.items.filter((i) => i.sold && filtro(i)).sort((a, b) => String(b.sold_at).localeCompare(String(a.sold_at)));

  const atrasado = k.due_at && k.due_at < hoje;
  const perto = k.due_at && !atrasado && k.due_at <= addDays(hoje, 3);

  return (
    <Screen title="Minha maleta" sub={`Maleta nº ${k.number}${k.due_at ? ` · acerto em ${shortDate(k.due_at)}` : ''}`}>
      {loc.state?.sold > 0 && (
        <div className="ok-msg" role="status">
          Venda registrada! Gere o certificado de garantia para a cliente nas peças vendidas, mais abaixo.
        </div>
      )}
      {(atrasado || perto) && (
        <div className={`alert ${atrasado ? 'alert--late' : 'alert--soon'}`}>
          <div className="alert__row">
            <div>
              <b>{atrasado ? 'Acerto atrasado' : k.due_at === hoje ? 'O acerto é hoje' : `Acerto em ${shortDate(k.due_at)}`}</b><br />
              <span>{atrasado ? `Estava previsto para ${shortDate(k.due_at)}. ` : ''}Combine a devolução das peças com a {brand}.</span>
            </div>
            <WaButton small href={waLink(BRAND_WA, `Oi! Aqui é a ${me?.name || ''}. Quero combinar o acerto da maleta nº ${k.number}.`)}>Combinar</WaButton>
          </div>
        </div>
      )}
      <div className="card grid2">
        <Stat label="Com você" value={t.leftCount} />
        <Stat label="Já vendidas" value={t.soldCount} />
      </div>

      <CategoryChips value={cat} onChange={setCat} pieces={k.items.map((i) => i.piece || {})} />

      <h2 className="section-title">Com você</h2>
      {comVoce.length === 0 ? (
        <Empty>Nenhuma peça {cat ? 'nesta categoria' : 'com você'}.</Empty>
      ) : (
        <div className="list">
          {comVoce.map((g) => (
            <div key={g.piece?.id || g.first.id} className="item" style={{ paddingLeft: 10 }}>
              <Thumb piece={g.piece} />
              <div className="item__main">
                <span className="row__title">{g.piece?.name}</span>
                <span className="row__meta">{brl(g.piece?.price)}{g.qty > 1 ? ` · ${g.qty} unidades` : ''}</span>
              </div>
              <ShareButton piece={g.piece} brand={brand} />
            </div>
          ))}
        </div>
      )}

      {vendidas.length > 0 && (
        <>
          <h2 className="section-title">Vendidas</h2>
          <div className="list">
            {vendidas.map((i) => (
              <div key={i.id} className="item" style={{ paddingLeft: 10 }}>
                <Thumb piece={i.piece} />
                <div className="item__main">
                  <span className="row__title">{i.piece?.name}</span>
                  <span className="row__meta">Vendida em {shortDate(i.sold_at)} · {brl(i.price ?? i.piece?.price)}</span>
                </div>
                <button type="button" className="mini-btn" onClick={() => setGarantia(i)}>Garantia</button>
              </div>
            ))}
          </div>
        </>
      )}
      <Link to="/vender" className="btn btn--primary">Marcar venda</Link>
      {garantia && <GarantiaSheet item={garantia} me={me} brand={brand} onClose={() => setGarantia(null)} />}
    </Screen>
  );
}

/* Compartilhar a peça com a cliente: foto + nome + preço */
function ShareButton({ piece, brand }) {
  const [busy, setBusy] = useState(false);
  const text = `${piece?.name} — ${brl(piece?.price)}\n${catOne(piece?.category)} ${brand}, banhado a ouro 18k, hipoalergênico e com garantia de 1 ano contra defeito de fabricação. Quer que eu separe para você?`;
  async function share() {
    setBusy(true);
    try {
      let files;
      if (piece?.photo_url) {
        try {
          const blob = await (await fetch(piece.photo_url)).blob();
          const f = new File([blob], `${piece.name || 'peca'}.jpg`, { type: blob.type || 'image/jpeg' });
          if (navigator.canShare?.({ files: [f] })) files = [f];
        } catch { /* sem a foto, compartilha só o texto */ }
      }
      if (navigator.share) {
        await navigator.share(files ? { files, text } : { text });
      } else {
        window.open(waLink('', text), '_blank', 'noopener');
      }
    } catch { /* cancelado */ } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className="mini-btn" onClick={share} disabled={busy} aria-label={`Compartilhar ${piece?.name}`}>
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" /></svg>
      Enviar
    </button>
  );
}

/* Certificado de garantia da peça vendida, com o nome da cliente */
function GarantiaSheet({ item, me, brand, onClose }) {
  const [client, setClient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const openedAt = useRef(Date.now());
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  async function gerar(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const blob = await warrantyPdf({ piece: item.piece, soldAt: item.sold_at, reseller: me?.name, client: client.trim(), brand });
      await shareOrDownload(blob, `Garantia-${(item.piece?.name || 'peca').replace(/\s+/g, '-')}.pdf`,
        `Certificado de garantia ${brand}: ${item.piece?.name}, comprada em ${dateBR(item.sold_at)}. Garantia de 1 ano contra defeito de fabricação.`);
      onClose();
    } catch {
      setError('Não foi possível gerar o certificado.');
      setBusy(false);
    }
  }
  return createPortal(
    <div className="sheet-bg" onClick={() => Date.now() - openedAt.current > 600 && !busy && onClose()}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="gar-title" onClick={(e) => e.stopPropagation()} onSubmit={gerar}>
        <div className="sheet__piece">
          <Thumb piece={item.piece} />
          <div className="row__main">
            <b id="gar-title">Certificado de garantia</b>
            <span className="row__meta">{item.piece?.name} · vendida em {dateBR(item.sold_at)}</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="cliente" style={{ color: 'var(--ink-2)' }}>Nome da cliente (opcional)</label>
          <input id="cliente" className="input" value={client} onChange={(e) => setClient(e.target.value)} autoFocus placeholder="Ex.: Maria Souza" />
        </div>
        <p className="row__meta">Garantia de 1 ano contra defeito de fabricação, com os cuidados da peça. Gera um PDF para enviar à cliente.</p>
        <ErrorMsg>{error}</ErrorMsg>
        <div className="btns">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Gerando…' : 'Gerar e enviar'}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
