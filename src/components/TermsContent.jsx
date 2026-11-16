import { BRAND_PHONE, TERMS, TERMS_DATE } from '../lib/terms';

/* Texto dos Termos de Uso e da Política de Privacidade */
export default function TermsContent({ brand = 'Lizano' }) {
  const fill = (t) => t.replaceAll('{brand}', brand).replaceAll('{phone}', BRAND_PHONE);
  return (
    <div className="terms">
      {TERMS.map((doc) => (
        <section key={doc.title}>
          <h2 className="terms__doc">{doc.title}</h2>
          {doc.sections.map((s) => (
            <div key={s.h} className="terms__sec">
              <h3>{s.h}</h3>
              {s.list && (
                <ul>
                  {s.list.map((li) => <li key={li}>{fill(li)}</li>)}
                </ul>
              )}
              {s.p?.map((p) => <p key={p}>{fill(p)}</p>)}
            </div>
          ))}
        </section>
      ))}
      <p className="terms__date">Versão de {TERMS_DATE}.</p>
    </div>
  );
}
