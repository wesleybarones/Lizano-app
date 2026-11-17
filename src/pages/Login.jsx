import { useState } from 'react';
import { useStore } from '../store';
import { api, IS_DEMO } from '../lib/api';
import { BRAND } from '../brand';
import { ErrorMsg, Monogram } from '../components/ui';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const { signIn } = useStore();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(login, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const quick = (l) => {
    setLogin(l);
    setPassword('123456');
  };

  return (
    <div className="login">
      <main className="login__main">
        <div className="stack" style={{ gap: 18 }}>
          <div className="brand-mark">
            <Monogram size={46} />
            <div>
              <div className="brand-mark__name">LIZANO</div>
              <div className="brand-mark__tag">SEMIJOIAS</div>
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600 }}>Consignado</h1>
            <p className="note" style={{ fontSize: 14 }}>Entre com o acesso que a {BRAND.name} criou para você.</p>
          </div>
        </div>
        <form className="stack" style={{ gap: 16 }} onSubmit={submit}>
          <div className="field">
            <label htmlFor="login">Celular ou e-mail</label>
            <input id="login" className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Ex.: 21 99999-9999 ou nome@email.com" value={login}
              onChange={(e) => setLogin(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <PasswordInput id="senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <ErrorMsg>{error}</ErrorMsg>
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
          <p className="note">Esqueceu a senha? Fale com a {BRAND.name} para criar uma nova.</p>
        </form>
        {IS_DEMO && (
          <div className="demo-box">
            <b style={{ color: 'var(--gold)' }}>Modo demonstração</b>
            <span>Dados de exemplo, salvos só neste aparelho. Senha: 123456.</span>
            <div className="btns">
              <button type="button" className="btn btn--ghost" onClick={() => quick('dono')}>Entrar como dono</button>
              <button type="button" className="btn btn--ghost" onClick={() => quick('carla')}>Como revendedora</button>
            </div>
            <button type="button" className="btn btn--link" onClick={() => { api.reset(); location.reload(); }}>
              Restaurar dados de exemplo
            </button>
          </div>
        )}
      </main>
      <p className="note" style={{ textAlign: 'center' }}>Feito por Barones Labs</p>
    </div>
  );
}
