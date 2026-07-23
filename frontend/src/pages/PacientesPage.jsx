import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

const EMPTY = { nombre: '', apellido: '', dni: '', telefono: '', email: '', fecha_nacimiento: '', notas: '' };

export default function PacientesPage() {
  const { isAdmin } = useAuth();
  const { empresaId, empresaParam, isSuperAdmin } = useEmpresaSelector();
  const isMobile = useIsMobile();

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editando, setEditando] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empresaId) cargar();
  }, [empresaId]);

  async function cargar(q = busqueda) {
    setLoading(true);
    try {
      const params = new URLSearchParams(empresaParam);
      if (q.trim()) params.set('q', q.trim());
      const { data } = await api.get(`/pacientes?${params}`);
      setPacientes(data);
    } finally {
      setLoading(false);
    }
  }

  function abrirNuevo() {
    setForm(EMPTY);
    setEditando(null);
    setError('');
    setShowForm(true);
  }

  function abrirEditar(p) {
    setForm({
      nombre: p.nombre, apellido: p.apellido, dni: p.dni || '',
      telefono: p.telefono || '', email: p.email || '',
      fecha_nacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : '',
      notas: p.notas || ''
    });
    setEditando(p.id);
    setError('');
    setShowForm(true);
  }

  async function guardar() {
    setError('');
    try {
      if (editando) {
        await api.put(`/pacientes/${editando}${empresaParam}`, form);
      } else {
        await api.post(`/pacientes${empresaParam}`, form);
      }
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este paciente?')) return;
    try {
      await api.delete(`/pacientes/${id}${empresaParam}`);
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
      <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Pacientes</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isSuperAdmin && <EmpresaSelector />}
            <button onClick={abrirNuevo} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>+ Nuevo paciente</button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            placeholder="Buscar por nombre, apellido, DNI o teléfono..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cargar(busqueda)}
            style={{ ...inputStyle, maxWidth: 400 }}
          />
          <button onClick={() => cargar(busqueda)} style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.5rem 0.75rem', borderRadius: 4, cursor: 'pointer' }}>Buscar</button>
          {busqueda && <button onClick={() => { setBusqueda(''); cargar(''); }} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 0.75rem', borderRadius: 4, cursor: 'pointer' }}>Limpiar</button>}
        </div>

        {showForm && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem' }}>{editando ? 'Editar paciente' : 'Nuevo paciente'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              {[['nombre', 'Nombre *'], ['apellido', 'Apellido *'], ['dni', 'DNI / Documento'], ['telefono', 'Teléfono'], ['email', 'Email'], ['fecha_nacimiento', 'Fecha de nacimiento']].map(([key, label]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={key === 'fecha_nacimiento' ? 'date' : key === 'email' ? 'email' : 'text'}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <label style={labelStyle}>Notas</label>
                <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            {error && <p style={{ color: '#dc2626', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={guardar} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 4, cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#64748b' }}>Cargando...</p>
        ) : pacientes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            No hay pacientes registrados.
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pacientes.map(p => (
              <div key={p.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                <div style={{ fontWeight: 600 }}>{p.apellido}, {p.nombre}</div>
                {p.dni && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>DNI: {p.dni}</div>}
                {p.telefono && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Tel: {p.telefono}</div>}
                {p.email && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{p.email}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button onClick={() => abrirEditar(p)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                  {isAdmin && <button onClick={() => eliminar(p.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Apellido, Nombre', 'DNI', 'Teléfono', 'Email', 'Fecha nac.', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pacientes.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{p.apellido}, {p.nombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.dni || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.telefono || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.email || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => abrirEditar(p)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                      {isAdmin && <button onClick={() => eliminar(p.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>}
                    </div>
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
