import { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../lib/api';
import { TERMS_VERSION } from '../../lib/terms';
import { ErrorMsg, Monogram } from '../../components/ui';
import TermsContent from '../../components/TermsContent';

/* Tela obrigatória: a revendedora aceita os termos antes de usar o app */
export default function AceiteTermos() {
  const { me, refreshMe, signOut } = useStore();
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = me?.name?.split(' ')[0] || '';
  const atualizou = !!me?.terms_version;

  async function aceitar() {
    setBusy(true);
    setError('');
    try {
      await api.auth.acceptTerms(TERMS_VERSION);
      await refreshMe();
    } catch (e) {
      setError(e.message || 'Não foi possível registrar o aceite. Tente de novo.');
      setBusy(false);
    }
  }
  return (
    <div className="app terms-gate">
      <header className="top">
        <span className="brand-mark" style={{ gap: 10 }}>
          <Monogram size={30} />
          <span className="eyebrow">{me?.brand_name || 'Lizano'}</span>
        </span>
        <h1 className="title">{atualizou ? 'Termos atualizados' : `Bem-vinda, ${first}`}</h1>
        <span className="sub">
          {atualizou
            ? 'Os termos mudaram. Leia e aceite a nova versão para continuar.'
            : 'Antes de começar, leia e aceite os Termos de Uso e a Política de Privacidade.'}
        </span>
      </header>
      <main className="main" style={{ paddingBottom: 24 }}>
        <div className="card terms-box" tabIndex={0} aria-label="Termos de Uso e Política de Privacidade">
          <TermsContent brand={me?.brand_name || 'Lizano'} />
        </div>
        <label className="terms-check">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
        </label>
        <ErrorMsg>{error}</ErrorMsg>
        <button type="button" className="btn btn--primary" disabled={!ok || busy} onClick={aceitar}>
          {busy ? 'Registrando…' : 'Aceitar e continuar'}
        </button>
        <button type="button" className="btn btn--link" onClick={signOut}>Não aceito, sair do app</button>
      </main>
    </div>
  );
}
