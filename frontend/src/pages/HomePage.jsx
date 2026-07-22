import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const MODULOS = [
  { nombre: 'inventario', label: 'Inventario', path: '/inventario', desc: 'Gestión de productos y stock' },
  { nombre: 'caja', label: 'Caja / Libro Diario', path: '/caja', desc: 'Registro de movimientos de caja' },
];

export default function HomePage() {
  const { user, hasModulo, isSuperAdmin } = useAuth();
  const modulosDisponibles = MODULOS.filter(m => hasModulo(m.nombre));

  return (
    <>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Bienvenido, {user?.nombre}</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          {user?.rol} · {isSuperAdmin ? 'Acceso total' : `${modulosDisponibles.length} módulo(s) disponible(s)`}
        </p>

        {modulosDisponibles.length === 0 && !isSuperAdmin ? (
          <div style={{ padding: '2rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', color: '#64748b' }}>
            No tenés módulos asignados. Contactá al administrador.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {modulosDisponibles.map(m => (
              <Link
                key={m.nombre}
                to={m.path}
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#1e293b',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
              >
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{m.label}</div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{m.desc}</div>
              </Link>
            ))}
            {isSuperAdmin && (
              <Link
                to="/admin/empresas"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#7c3aed',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
              >
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Admin Empresas</div>
                <div style={{ fontSize: '0.875rem', color: '#c4b5fd' }}>Gestión de empresas y usuarios</div>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
