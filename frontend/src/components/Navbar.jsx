import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#1e293b', color: 'white' }}>
      <Link to="/inventario" style={{ color: 'white' }}>Inventario</Link>
      <Link to="/caja" style={{ color: 'white' }}>Caja</Link>
      {isSuperAdmin && <Link to="/admin/empresas" style={{ color: 'white' }}>Admin Empresas</Link>}
      <span style={{ marginLeft: 'auto' }}>{user?.nombre} ({user?.rol})</span>
      <button onClick={handleLogout} style={{ color: 'white', background: 'none', border: '1px solid white', cursor: 'pointer', padding: '0.25rem 0.75rem' }}>
        Salir
      </button>
    </nav>
  );
}
