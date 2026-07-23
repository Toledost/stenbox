import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const EMPTY_FORM = { id_profesional: '', dia_semana: '0', hora_inicio: '08:00', hora_fin: '17:00', duracion_turno: '30' };

export default function AgendaConfigPage() {
  const { isAdmin } = useAuth();
  const { empresaId, empresaParam, isSuperAdmin } = useEmpresaSelector();
  const isMobile = useIsMobile();

  const [profesionales, setProfesionales] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editando, setEditando] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [filtroProfesional, setFiltroProfesional] = useState('');

  useEffect(() => {
    if (empresaId) {
      cargarProfesionales();
      cargarConfigs();
    }
  }, [empresaId]);

  async function cargarProfesionales() {
    const { data } = await api.get(`/profesionales?${new URLSearchParams(empresaParam)}&activos=1`);
    setProfesionales(data);
  }

  async function cargarConfigs() {
    const params = new URLSearchParams(empresaParam);
    if (filtroProfesional) params.set('id_profesional', filtroProfesional);
    const { data } = await api.get(`/agenda-config?${params}`);
    setConfigs(data);
  }

  function abrirNuevo() {
    setForm(EMPTY_FORM);
    setEditando(null);
    setError('');
    setShowForm(true);
  }

  function abrirEditar(c) {
    setForm({
      id_profesional: c.id_profesional,
      dia_semana: String(c.dia_semana),
      hora_inicio: c.hora_inicio,
      hora_fin: c.hora_fin,
      duracion_turno: String(c.duracion_turno),
    });
    setEditando(c.id);
    setError('');
    setShowForm(true);
  }

  async function guardar() {
    setError('');
    try {
      const payload = { ...form, dia_semana: Number(form.dia_semana), duracion_turno: Number(form.duracion_turno) };
      if (editando) {
        await api.put(`/agenda-config/${editando}${empresaParam}`, payload);
      } else {
        await api.post(`/agenda-config${empresaParam}`, payload);
      }
      setShowForm(false);
      cargarConfigs();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta configuración?')) return;
    try {
      await api.delete(`/agenda-config/${id}${empresaParam}`);
      cargarConfigs();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  }

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4, boxSizing: 'border-box', fontSize: '0.9rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 };

  const configsFiltradas = filtroProfesional
    ? configs.filter(c => String(c.id_profesional) === filtroProfesional)
    : configs;

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Configuración de Agenda</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>Definí los horarios de atención por profesional y día de la semana</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isSuperAdmin && <EmpresaSelector />}
            {isAdmin && <button onClick={abrirNuevo} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>+ Agregar franja horaria</button>}
          </div>
        </div>

        {/* Filtro por profesional */}
        <div style={{ marginBottom: '1rem' }}>
          <select value={filtroProfesional} onChange={e => { setFiltroProfesional(e.target.value); }} style={{ ...inputStyle, maxWidth: 280 }}>
            <option value="">Todos los profesionales</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        {showForm && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem' }}>{editando ? 'Editar franja horaria' : 'Nueva franja horaria'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Profesional *</label>
                <select value={form.id_profesional} onChange={e => setForm(f => ({ ...f, id_profesional: e.target.value }))} style={inputStyle} disabled={!!editando}>
                  <option value="">Seleccioná...</option>
                  {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Día de la semana *</label>
                <select value={form.dia_semana} onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))} style={inputStyle} disabled={!!editando}>
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Duración por turno (min)</label>
                <select value={form.duracion_turno} onChange={e => setForm(f => ({ ...f, duracion_turno: e.target.value }))} style={inputStyle}>
                  {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Hora inicio *</label>
                <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hora fin *</label>
                <input type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            {error && <p style={{ color: '#dc2626', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={guardar} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 4, cursor: 'pointer' }}>Guardar</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        )}

        {configsFiltradas.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            No hay franjas horarias configuradas. {isAdmin && 'Agregá la primera.'}
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {configsFiltradas.map(c => (
              <div key={c.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', opacity: c.activo ? 1 : 0.6 }}>
                <div style={{ fontWeight: 600 }}>{c.profesional_nombre}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{DIAS[c.dia_semana]} · {c.hora_inicio.slice(0,5)} – {c.hora_fin.slice(0,5)} · {c.duracion_turno} min/turno</div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => abrirEditar(c)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                    <button onClick={() => eliminar(c.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Profesional', 'Día', 'Horario', 'Duración turno', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configsFiltradas.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: c.activo ? 1 : 0.6 }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{c.profesional_nombre}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{DIAS[c.dia_semana]}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{c.hora_inicio.slice(0,5)} – {c.hora_fin.slice(0,5)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{c.duracion_turno} min</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => abrirEditar(c)} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                        <button onClick={() => eliminar(c.id)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
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
