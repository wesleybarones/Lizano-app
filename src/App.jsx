import { Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Inicio from './pages/admin/Inicio';
import Pecas from './pages/admin/Pecas';
import PecaForm from './pages/admin/PecaForm';
import Equipe from './pages/admin/Equipe';
import RevendedoraForm from './pages/admin/RevendedoraForm';
import Maletas from './pages/admin/Maletas';
import MaletaNova from './pages/admin/MaletaNova';
import Maleta from './pages/admin/Maleta';
import Acerto from './pages/admin/Acerto';
import Relatorios from './pages/admin/Relatorios';
import CurvaABC from './pages/admin/CurvaABC';
import MinhaMaleta from './pages/rev/MinhaMaleta';
import Vender from './pages/rev/Vender';
import MeusNumeros from './pages/rev/MeusNumeros';
import Historico from './pages/rev/Historico';

function Routed() {
  const { me } = useStore();
  if (me === undefined) return <Loading />;
  if (!me) return <Login />;
  if (me.role === 'admin') {
    return (
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/pecas" element={<Pecas />} />
        <Route path="/pecas/nova" element={<PecaForm />} />
        <Route path="/pecas/:id" element={<PecaForm />} />
        <Route path="/equipe" element={<Equipe />} />
        <Route path="/equipe/nova" element={<RevendedoraForm />} />
        <Route path="/equipe/:id" element={<RevendedoraForm />} />
        <Route path="/maletas" element={<Maletas />} />
        <Route path="/maletas/nova" element={<MaletaNova />} />
        <Route path="/maletas/:id" element={<Maleta />} />
        <Route path="/maletas/:id/acerto" element={<Acerto />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/relatorios/abc" element={<CurvaABC />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<MinhaMaleta />} />
      <Route path="/vender" element={<Vender />} />
      <Route path="/numeros" element={<MeusNumeros />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Routed />
    </StoreProvider>
  );
}
