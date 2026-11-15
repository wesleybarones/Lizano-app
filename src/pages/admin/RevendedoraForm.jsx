import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAction, useStore } from '../../store';
import { api, IS_DEMO } from '../../lib/api';
import { ErrorMsg, Loading, Screen } from '../../components/ui';

const EMPTY = { name: '', login: '', commission_pct: '30', bonus_amount: '0', goal_amount: '0', goal_type: 'pieces', active: true };

export default function RevendedoraForm() {
  const { id } = useParams();
  const { resellers, me, loaded } = useStore();
  const nav = useNavigate();
  const { busy, error, run } = useAction();
  const [form, setForm] = useState(EMPTY);
  const [password, setPassword] = useState('');
  const [created, setCreated] = useState(null);
  const existing = id ? resellers.find((r) => r.id === id) : null;

  useEffect(() => {
    if (existing) setForm({ ...EMPTY, ...existing });
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (id && !loaded) return <Screen title="Revendedora" back="/equipe"><Loading /></Screen>;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const ok = await run(() => api.resellers.save(form, me.brand_id, password));
    if (!ok) return;
    if (id) nav('/equipe');
    else setCreated({ login: form.login, password });
  }

  if (created) {
    return (
      <Screen title="Acesso criado" back="/equipe">
        <div className="card">
          <p>Envie para a revendedora:</p>
          <div className="row"><span>Celular ou e-mail</span><b>{created.login}</b></div>
          <div className="row"><span>Senha</span><b>{created.password}</b></div>
          <p className="row__meta">Ela instala o app pelo navegador do celular (Compartilhar › Adicionar à Tela de Início) e entra com esses dados.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => nav('/equipe')}>Concluir</button>
      </Screen>
    );
  }

  return (
    <Screen title={id ? 'Editar revendedora' : 'Nova revendedora'} back="/equipe">
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input id="nome" className="input" required value={form.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label htmlFor="login">Celular ou e-mail (login)</label>
          <input id="login" className="input" required value={form.login} onChange={set('login')} disabled={!!id}
            placeholder="21999999999" />
          {id && <span className="hint">O login não muda depois de criado.</span>}
        </div>
        {!id && (
          <div className="field">
            <label htmlFor="senha">Senha inicial</label>
            <input id="senha" className="input" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            <span className="hint">Mínimo de 6 caracteres. Você envia para ela junto com o login.</span>
          </div>
        )}
        <h2 className="section-title">Regras</h2>
        <div className="field">
          <label htmlFor="com">Comissão (%)</label>
          <input id="com" className="input" type="number" inputMode="decimal" min="0" max="100" step="0.5" required value={form.commission_pct} onChange={set('commission_pct')} />
        </div>
        <div className="field">
          <label htmlFor="tipo">Meta do bônus por</label>
          <select id="tipo" className="input" value={form.goal_type} onChange={set('goal_type')}>
            <option value="pieces">Quantidade de peças vendidas</option>
            <option value="value">Valor vendido (R$)</option>
          </select>
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="meta">{form.goal_type === 'value' ? 'Meta por maleta (R$)' : 'Meta por maleta (peças)'}</label>
            <input id="meta" className="input" type="number" inputMode={form.goal_type === 'value' ? 'decimal' : 'numeric'} min="0"
              step={form.goal_type === 'value' ? '0.01' : '1'} value={form.goal_amount} onChange={set('goal_amount')} />
          </div>
          <div className="field">
            <label htmlFor="bonus">Bônus ao bater a meta (R$)</label>
            <input id="bonus" className="input" type="number" inputMode="decimal" min="0" step="0.01" value={form.bonus_amount} onChange={set('bonus_amount')} />
          </div>
        </div>
        <span className="hint">
          {form.goal_type === 'value'
            ? 'Ex.: vendeu R$ 1.000,00 ou mais na maleta, ganha o bônus.'
            : 'Ex.: vendeu 15 peças ou mais na maleta, ganha o bônus.'} Deixe a meta em 0 para não ter bônus.
        </span>
        {id && (
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', minHeight: 44 }}>
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} style={{ width: 20, height: 20 }} />
            Acesso ativo
          </label>
        )}
        {IS_DEMO && !id && <p className="hint">No modo demonstração, o acesso funciona só neste aparelho.</p>}
        <ErrorMsg>{error}</ErrorMsg>
        <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
      </form>
    </Screen>
  );
}
