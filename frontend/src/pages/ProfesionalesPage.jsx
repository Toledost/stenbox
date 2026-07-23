import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

const EMPTY = { nombre: '', especialidad: '', activo: 1 };

export default function ProfesionalesPage() {
  const { isAdmin } = useAuth();
  const { empresaId, empresaParam, isSuperAdmin } = useEmpresaSelector();
  const isMobile = useIsMobile();

  const [profesionales, setProfesionales] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editando, setEditando] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (empresaId) cargar();
  }, [empresaId]);

  async function cargar() {
    const { data } = await api.get(`/profesionales?${new URLSearchParams(empresaParam)}`);
    setProfesionales(data);
  }

  function abrirNuevo() {
    setForm(EMPTY);
    setEditando(null);
    setError('');
    setShowForm(true);
  }

  function abrirEditar(p) {
    setForm({ nombre: p.nombre, especialidad: p.especialidad || '', activo: p.activo });
    setEditando(p.id);
    setError('');
    setShowForm(true);
  }

  async function guardar() {
    setError('');
    try {
      if (editando) {
        await api.put(`/profesionales/${editando}${empresaParam}`, form);
      } else {
        await api.post(`/profesionales${empresaParam}`, form);
      }
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este profesional?')) return;
    try {
      await api.delete(`/profesionales/${id}${empresaParam}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  }

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4, boxSizing: 'border-box', fontSize: '0.9rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 };

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Profesionales</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isSuperAdmin && <EmpresaSelector />}
            {isAdmin && <button onClick={abrirNuevo} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>+ Nuevo profesional</button>}
          </div>
        </div>

        {showForm && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem' }}>{editando ? 'Editar profesional' : 'Nuevo profesional'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Especialidad</label>
                <input value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} style={inputStyle} />
              </div>
              {editando && (
                <div>
                  <label style={labelStyle}>Estado</label>
                  <select value={form.activo} onChange={e => setForm(f => ({ ...f, activo: Number(e.target.value) }))} style={inputStyle}>
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                  </select>
                </div>
              )}
            </div>
            {error && <p style={{ color: '#dc2626', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={guardar} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 4, cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {profesionales.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            No hay profesionales cargados. {isAdmin && 'Agregá el primero.'}
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {profesionales.map(p => (
              <div key={p.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', opacity: p.activo ? 1 : 0.6 }}>
                <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                {p.especialidad && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{p.especialidad}</div>}
                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: p.activo ? '#16a34a' : '#dc2626' }}>{p.activo ? 'Activo' : 'Inactivo'}</div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => abrirEditar(p)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                    <button onClick={() => eliminar(p.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Nombre', 'Especialidad', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profesionales.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: p.activo ? 1 : 0.6 }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{p.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.especialidad || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ background: p.activo ? '#dcfce7' : '#fee2e2', color: p.activo ? '#16a34a' : '#dc2626', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => abrirEditar(p)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                        <button onClick={() => eliminar(p.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
