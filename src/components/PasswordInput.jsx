import { useState } from 'react';

/* Campo de senha com botão de olho para mostrar/esconder */
export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input id={id} className="input" type={show ? 'text' : 'password'} autoComplete={autoComplete}
        autoCapitalize="none" autoCorrect="off" spellCheck={false} value={value} onChange={onChange} {...rest} />
      <button type="button" className="pw__eye" onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Esconder senha' : 'Mostrar senha'} aria-pressed={show}>
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {show && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  );
}
