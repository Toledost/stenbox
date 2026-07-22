import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import InventarioPage from './pages/InventarioPage';
import CajaPage from './pages/CajaPage';
import AdminEmpresasPage from './pages/AdminEmpresasPage';
import CategoriaPage from './pages/CategoriaPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
          <Route path="/caja" element={<ProtectedRoute><CajaPage /></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><CategoriaPage /></ProtectedRoute>} />
          <Route path="/admin/empresas" element={<ProtectedRoute requireSuperAdmin><AdminEmpresasPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/inventario" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
