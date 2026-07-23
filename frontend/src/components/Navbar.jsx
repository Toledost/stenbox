import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Navbar() {
  const { user, logout, isSuperAdmin, isAdmin, hasModulo } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkStyle = { color: 'white', textDecoration: 'none', padding: isMobile ? '0.6rem 1rem' : '0', display: 'block' };

  return (
    <nav style={{ background: '#1e293b', color: 'white', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
        <Link to="/" style={{ color: 'white', fontWeight: '600', textDecoration: 'none' }}>Stenbox</Link>

        {isMobile ? (
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: 'white', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '1.1rem' }}
          >
            ☰
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {hasModulo('inventario') && <Link to="/inventario" style={linkStyle}>Inventario</Link>}
            {hasModulo('inventario') && isAdmin && <Link to="/categorias" style={linkStyle}>Categorías</Link>}
            {hasModulo('caja') && <Link to="/caja" style={linkStyle}>Caja</Link>}
            {isSuperAdmin && <Link to="/admin/empresas" style={linkStyle}>Admin Empresas</Link>}
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user?.nombre} ({user?.rol})</span>
            <button onClick={handleLogout} style={{ color: 'white', background: 'none', border: '1px solid white', cursor: 'pointer', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>Salir</button>
          </div>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', padding: '0.5rem 0' }} onClick={() => setMenuOpen(false)}>
          {hasModulo('inventario') && <Link to="/inventario" style={linkStyle}>Inventario</Link>}
          {hasModulo('inventario') && isAdmin && <Link to="/categorias" style={linkStyle}>Categorías</Link>}
          {hasModulo('caja') && <Link to="/caja" style={linkStyle}>Caja</Link>}
          {isSuperAdmin && <Link to="/admin/empresas" style={linkStyle}>Admin Empresas</Link>}
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user?.nombre} ({user?.rol})</span>
            <button onClick={handleLogout} style={{ color: 'white', background: 'none', border: '1px solid white', cursor: 'pointer', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>Salir</button>
          </div>
        </div>
      )}
    </nav>
  );
}
