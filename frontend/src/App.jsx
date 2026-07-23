import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import InventarioPage from './pages/InventarioPage';
import CajaPage from './pages/CajaPage';
import AdminEmpresasPage from './pages/AdminEmpresasPage';
import CategoriaPage from './pages/CategoriaPage';
import CamposConfigPage from './pages/CamposConfigPage';
import TiposMovimientoPage from './pages/TiposMovimientoPage';
import TurneroPage from './pages/TurneroPage';
import PacientesPage from './pages/PacientesPage';
import ProfesionalesPage from './pages/ProfesionalesPage';
import AgendaConfigPage from './pages/AgendaConfigPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
          <Route path="/inventario/campos" element={<ProtectedRoute><CamposConfigPage /></ProtectedRoute>} />
          <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
          <Route path="/caja/tipos" element={<ProtectedRoute><TiposMovimientoPage /></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><CategoriaPage /></ProtectedRoute>} />
          <Route path="/turnos" element={<ProtectedRoute><TurneroPage /></ProtectedRoute>} />
          <Route path="/turnos/pacientes" element={<ProtectedRoute><PacientesPage /></ProtectedRoute>} />
          <Route path="/turnos/profesionales" element={<ProtectedRoute><ProfesionalesPage /></ProtectedRoute>} />
          <Route path="/turnos/config" element={<ProtectedRoute><AgendaConfigPage /></ProtectedRoute>} />
          <Route path="/admin/empresas" element={<ProtectedRoute requireSuperAdmin><AdminEmpresasPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
