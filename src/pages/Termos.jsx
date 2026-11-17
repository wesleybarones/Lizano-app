import { useStore } from '../store';
import { Screen } from '../components/ui';
import TermsContent from '../components/TermsContent';
import { dateBR } from '../lib/format';

/* Leitura dos termos a qualquer momento (pelo perfil) */
export default function Termos() {
  const { me, brandName } = useStore();
  return (
    <Screen title="Termos e privacidade" back="/perfil"
      sub={me?.terms_accepted_at ? `Você aceitou em ${dateBR(me.terms_accepted_at)}.` : undefined}>
      <div className="card terms-box terms-box--full">
        <TermsContent brand={brandName} />
      </div>
    </Screen>
  );
}
