import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { ErrorMsg, Screen } from '../components/ui';
import PhotoPicker from '../components/PhotoPicker';
import PasswordInput from '../components/PasswordInput';
import { initials } from '../lib/format';
import { getThemePref, setThemePref } from '../lib/theme';

export default function Perfil() {
  const { me, signOut, refreshMe } = useStore();
  const nav = useNavigate();
  const admin = me.role === 'admin';
  const sair = async () => {
    nav('/', { replace: true });
    await signOut();
  };
  return (
    <Screen title={admin ? 'Perfil da empresa' : 'Meu perfil'}>
      {admin ? <Empresa me={me} onSaved={refreshMe} /> : (
        <div className="card" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <div className="avatar" aria-hidden="true">{initials(me.name)}</div>
          <div className="row__main">
            <span className="row__title">{me.name}</span>
            <span className="row__meta">{me.login}</span>
          </div>
        </div>
      )}
      <Aparencia />
      <Senha />
      <Link to="/termos" className="btn btn--link">Termos de uso e privacidade</Link>
      <button type="button" className="btn btn--ghost" onClick={sair}>Sair do app</button>
    </Screen>
  );
}

function Empresa({ me, onSaved }) {
  const [name, setName] = useState(me.brand_name || '');
  const [logo, setLogo] = useState(me.brand_logo || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setName(me.brand_name || '');
    setLogo(me.brand_logo || '');
  }, [me.brand_name, me.brand_logo]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api.brand.save({ name, logo_url: logo }, me.brand_id);
      await onSaved();
      setMsg('Perfil da empresa salvo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="card stack" onSubmit={submit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="logo-big">{logo ? <img src={logo} alt="Logo da empresa" /> : initials(name)}</div>
        <PhotoPicker
          label="Logo ou foto da empresa"
          hasPhoto={!!logo}
          onPick={async (file) => setLogo(await api.pieces.uploadPhoto(file, me.brand_id))}
          onRemove={() => setLogo('')}
        />
      </div>
      <div className="field">
        <label htmlFor="empresa">Nome da empresa</label>
        <input id="empresa" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        <span className="row__meta">Aparece no topo do app para você e para as revendedoras.</span>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      {msg && <div className="ok-msg" role="status">{msg}</div>}
      <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</button>
    </form>
  );
}

function Senha() {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);
  useEffect(() => {
    if (open) formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (pw !== pw2) return setError('As duas senhas não são iguais.');
    setBusy(true);
    try {
      await api.auth.changePassword(pw);
      setMsg('Senha alterada.');
      setPw('');
      setPw2('');
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (!open) {
    return (
      <>
        {msg && <div className="ok-msg" role="status">{msg}</div>}
        <button type="button" className="btn btn--ghost" onClick={() => { setOpen(true); setMsg(''); }}>Trocar minha senha</button>
      </>
    );
  }
  return (
    <form ref={formRef} className="card stack" onSubmit={submit}>
      <b>Trocar senha</b>
      <div className="field">
        <label htmlFor="nova">Nova senha</label>
        <PasswordInput id="nova" autoComplete="new-password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="nova2">Repita a nova senha</label>
        <PasswordInput id="nova2" autoComplete="new-password" minLength={6} required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      <div className="btns">
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>Cancelar</button>
        <button className="btn btn--primary" type="submit" disabled={busy}>Salvar senha</button>
      </div>
    </form>
  );
}

/* Escolha de modo claro ou escuro */
function Aparencia() {
  const [pref, setPref] = useState(getThemePref);
  const opts = [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']];
  const choose = (v) => { setPref(v); setThemePref(v); };
  return (
    <div className="card">
      <div className="row__main">
        <span className="row__title">Aparência</span>
        <span className="row__meta">{pref === 'auto' ? 'Segue o modo claro ou escuro do celular.' : pref === 'light' ? 'Fundo claro, ótimo para usar no sol.' : 'Fundo azul-marinho da Lizano.'}</span>
      </div>
      <div className="toggle toggle--full" role="group" aria-label="Aparência do app">
        {opts.map(([v, label]) => (
          <button key={v} type="button" aria-pressed={pref === v} onClick={() => choose(v)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
