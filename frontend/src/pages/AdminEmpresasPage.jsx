import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Pencil, Trash2, Save, X, Plus, Check, Loader2 } from 'lucide-react';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };

const MODULOS_DISPONIBLES = [
  { nombre: 'inventario', label: 'Inventario' },
  { nombre: 'caja', label: 'Caja' },
];

const ROLES = [
  { id: 2, label: 'Admin' },
  { id: 3, label: 'Cajero' },
];

// IDs fijos de módulos (deben coincidir con la BD)
const MODULO_ID = { inventario: 1, caja: 2 };

function UsuarioRow({ usuario, onActualizar, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [rol, setRol] = useState(usuario.id_rol);
  const [modulosActivos, setModulosActivos] = useState(usuario.modulos.map(m => m.nombre));
  const [guardando, setGuardando] = useState(false);

  function toggleModulo(nombre) {
    setModulosActivos(prev =>
      prev.includes(nombre) ? prev.filter(m => m !== nombre) : [...prev, nombre]
    );
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onActualizar(usuario.id, { id_rol: rol, modulos: modulosActivos });
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr style={{ background: 'white' }}>
      <td style={tdStyle}>
        <div style={{ fontWeight: '500' }}>{usuario.nombre} {usuario.apellido}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{usuario.username} · {usuario.email}</div>
      </td>
      <td style={tdStyle}>
        {editando ? (
          <select value={rol} onChange={e => setRol(Number(e.target.value))}
            style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: '0.85rem' }}>{usuario.rol_nombre}</span>
        )}
      </td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {MODULOS_DISPONIBLES.map(m => {
            const activo = editando ? modulosActivos.includes(m.nombre) : usuario.modulos.some(um => um.nombre === m.nombre);
            return (
              <button
                key={m.nombre}
                onClick={() => editando && toggleModulo(m.nombre)}
                style={{
                  padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem',
                  border: `1px solid ${activo ? '#22c55e' : '#cbd5e1'}`,
                  background: activo ? '#dcfce7' : '#f8fafc',
                  color: activo ? '#15803d' : '#94a3b8',
                  cursor: editando ? 'pointer' : 'default',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </td>
      <td style={{ ...tdStyle, textAlign: 'center' }}>
        {editando ? (
          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
            <button onClick={guardar} disabled={guardando} title="Guardar cambios"
              style={{ padding: '0.25rem 0.6rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {guardando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Guardar
            </button>
            <button onClick={() => { setEditando(false); setRol(usuario.id_rol); setModulosActivos(usuario.modulos.map(m => m.nombre)); }}
              title="Cancelar edición"
              style={{ padding: '0.25rem 0.6rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <X size={14} /> Cancelar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
            <button onClick={() => setEditando(true)} title="Editar rol y módulos del usuario"
              style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Pencil size={14} /> Editar
            </button>
            <button onClick={() => onEliminar(usuario)} title="Eliminar usuario permanentemente"
              style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function PanelUsuarios({ empresaId, empresaNombre }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const emptyForm = { nombre: '', apellido: '', email: '', username: '', password: '', id_rol: 2, modulos: ['inventario', 'caja'] };
  const [form, setForm] = useState(emptyForm);

  async function cargar() {
    setCargando(true);
    try {
      const { data } = await api.get(`/empresas/${empresaId}/usuarios`);
      setUsuarios(data);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [empresaId]);

  async function crearUsuario(e) {
    e.preventDefault();
    setError('');
    try {
      const moduloIds = form.modulos.map(nombre => MODULO_ID[nombre]).filter(Boolean);
      await api.post(`/empresas/${empresaId}/usuarios`, { ...form, modulos: moduloIds });
      setForm(emptyForm);
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  async function actualizarUsuario(id, datos) {
    const moduloIds = datos.modulos.map(nombre => MODULO_ID[nombre]).filter(Boolean);
    await api.put(`/empresas/usuarios/${id}`, { id_rol: datos.id_rol, modulos: moduloIds });
    cargar();
  }

  async function eliminarUsuario(usuario) {
    if (!confirm(`¿Eliminar usuario "${usuario.nombre} ${usuario.apellido}"?`)) return;
    await api.delete(`/empresas/usuarios/${usuario.id}`);
    cargar();
  }

  function toggleFormModulo(nombre) {
    setForm(f => ({
      ...f,
      modulos: f.modulos.includes(nombre) ? f.modulos.filter(m => m !== nombre) : [...f.modulos, nombre]
    }));
  }

  return (
    <div style={{ padding: '1rem 1.5rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Usuarios de {empresaNombre}</h4>
        <button onClick={() => { setMostrarForm(!mostrarForm); setError(''); }}
          title={mostrarForm ? 'Cancelar creación de usuario' : 'Crear un nuevo usuario para esta empresa'}
          style={{ padding: '0.3rem 0.75rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {mostrarForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nuevo usuario</>}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={crearUsuario} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input required placeholder="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
            <input required placeholder="Apellido *" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input required placeholder="Usuario *" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, minWidth: '120px' }} />
            <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, minWidth: '160px' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input required type="password" placeholder="Contraseña *" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, minWidth: '140px' }} />
            <select value={form.id_rol} onChange={e => setForm(f => ({ ...f, id_rol: Number(e.target.value) }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Módulos:</span>
            {MODULOS_DISPONIBLES.map(m => {
              const activo = form.modulos.includes(m.nombre);
              return (
                <button key={m.nombre} type="button" onClick={() => toggleFormModulo(m.nombre)}
                  style={{
                    padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer',
                    border: `1px solid ${activo ? '#22c55e' : '#cbd5e1'}`,
                    background: activo ? '#dcfce7' : 'white',
                    color: activo ? '#15803d' : '#94a3b8',
                  }}>
                  {m.label}
                </button>
              );
            })}
          </div>
          {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
          <div>
            <button type="submit" title="Confirmar creación del usuario" style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Check size={15} /> Crear usuario
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Cargando...</p>
      ) : usuarios.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin usuarios en esta empresa.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Usuario</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Módulos</th>
              <th style={{ ...thStyle, textAlign: 'center', width: '130px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <UsuarioRow key={u.id} usuario={u} onActualizar={actualizarUsuario} onEliminar={eliminarUsuario} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [form, setForm] = useState({ nombre: '', estado: 'prueba' });
  const [expandida, setExpandida] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    const { data } = await api.get('/empresas');
    setEmpresas(data);
  }

  useEffect(() => { cargar(); }, []);

  async function crearEmpresa(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/empresas', form);
      setForm({ nombre: '', estado: 'prueba' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  async function eliminarEmpresa(id) {
    if (!confirm('¿Eliminar empresa y todos sus datos?')) return;
    await api.delete(`/empresas/${id}`);
    if (expandida === id) setExpandida(null);
    cargar();
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>Administración de Empresas</h2>

        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Nueva empresa</h3>
          <form onSubmit={crearEmpresa} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Nombre *" required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', minWidth: '200px' }} />
            <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
              <option value="prueba">Prueba</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <button type="submit" style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Crear
            </button>
            {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {empresas.map(emp => (
            <div key={emp.id} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '1rem' }}>
                <button onClick={() => setExpandida(expandida === emp.id ? null : emp.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#64748b', padding: 0, lineHeight: 1 }}>
                  {expandida === emp.id ? '▼' : '▶'}
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: '600' }}>{emp.nombre}</span>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '12px',
                    background: emp.estado === 'activo' ? '#dcfce7' : emp.estado === 'inactivo' ? '#fee2e2' : '#fef9c3',
                    color: emp.estado === 'activo' ? '#15803d' : emp.estado === 'inactivo' ? '#b91c1c' : '#854d0e' }}>
                    {emp.estado}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  #{emp.id} · {new Date(emp.created_at).toLocaleDateString('es-AR')}
                </span>
                <button onClick={() => eliminarEmpresa(emp.id)} title="Eliminar empresa y todos sus datos"
                  style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>

              {expandida === emp.id && (
                <PanelUsuarios empresaId={emp.id} empresaNombre={emp.nombre} />
              )}
            </div>
          ))}

          {empresas.length === 0 && (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sin empresas creadas.</p>
          )}
        </div>
      </div>
    </>
  );
}
