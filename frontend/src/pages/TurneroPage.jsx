import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import api from '../api/axios';
import { useIsMobile } from '../hooks/useIsMobile';

const ESTADOS = {
  disponible: { label: 'Disponible', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  reservado:  { label: 'Reservado',  bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  completado: { label: 'Completado', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  cancelado:  { label: 'Cancelado',  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

function fechaStr(date) {
  return date.toISOString().split('T')[0];
}

function getLunes(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function TurneroPage() {
  const { isAdmin } = useAuth();
  const { empresaId, empresaParam, isSuperAdmin } = useEmpresaSelector();
  const isMobile = useIsMobile();

  const [vista, setVista] = useState('semana'); // 'semana' | 'dia'
  const [semanaBase, setSemanaBase] = useState(getLunes(new Date()));
  const [fechaDia, setFechaDia] = useState(fechaStr(new Date()));
  const [profesionales, setProfesionales] = useState([]);
  const [filtroProfesional, setFiltroProfesional] = useState('');
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal de asignación
  const [modalTurno, setModalTurno] = useState(null);
  const [modalPacienteId, setModalPacienteId] = useState('');
  const [modalEstado, setModalEstado] = useState('reservado');
  const [modalNotas, setModalNotas] = useState('');
  const [modalError, setModalError] = useState('');
  const [busqPaciente, setBusqPaciente] = useState('');

  // Modal generar turnos
  const [showGenerar, setShowGenerar] = useState(false);
  const [genFecha, setGenFecha] = useState(fechaStr(new Date()));
  const [genProfesional, setGenProfesional] = useState('');
  const [genMsg, setGenMsg] = useState('');

  useEffect(() => {
    if (empresaId) {
      cargarProfesionales();
      cargarPacientes();
    }
  }, [empresaId]);

  useEffect(() => {
    if (empresaId) cargarTurnos();
  }, [empresaId, vista, semanaBase, fechaDia, filtroProfesional]);

  async function cargarProfesionales() {
    const { data } = await api.get(`/profesionales?${new URLSearchParams(empresaParam)}&activos=1`);
    setProfesionales(data);
  }

  async function cargarPacientes(q = '') {
    const params = new URLSearchParams(empresaParam);
    if (q) params.set('q', q);
    const { data } = await api.get(`/pacientes?${params}`);
    setPacientes(data);
  }

  async function cargarTurnos() {
    setLoading(true);
    try {
      const params = new URLSearchParams(empresaParam);
      if (filtroProfesional) params.set('id_profesional', filtroProfesional);
      if (vista === 'semana') {
        params.set('fecha_desde', fechaStr(semanaBase));
        params.set('fecha_hasta', fechaStr(addDays(semanaBase, 6)));
        const { data } = await api.get(`/turnos/semana?${params}`);
        setTurnos(data);
      } else {
        params.set('fecha', fechaDia);
        const { data } = await api.get(`/turnos/dia?${params}`);
        setTurnos(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function abrirModal(turno) {
    setModalTurno(turno);
    setModalPacienteId(turno.id_paciente ? String(turno.id_paciente) : '');
    setModalEstado(turno.estado);
    setModalNotas(turno.notas || '');
    setModalError('');
    setBusqPaciente('');
  }

  async function guardarTurno() {
    setModalError('');
    try {
      await api.put(`/turnos/${modalTurno.id}${empresaParam}`, {
        id_paciente: modalPacienteId || null,
        estado: modalEstado,
        notas: modalNotas,
      });
      setModalTurno(null);
      cargarTurnos();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error al guardar');
    }
  }

  async function eliminarTurno(id) {
    if (!confirm('¿Eliminar este turno?')) return;
    try {
      await api.delete(`/turnos/${id}${empresaParam}`);
      setModalTurno(null);
      cargarTurnos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  }

  async function generarTurnos() {
    setGenMsg('');
    try {
      const payload = { fecha: genFecha };
      if (genProfesional) payload.id_profesional = genProfesional;
      const params = new URLSearchParams(empresaParam);
      const { data } = await api.post(`/turnos/generar?${params}`, payload);
      setGenMsg(data.message);
      cargarTurnos();
    } catch (err) {
      setGenMsg(err.response?.data?.message || 'Error al generar');
    }
  }

  // Agrupar turnos por fecha+profesional para vista semanal
  function turnosDeDia(fecha, idProf) {
    return turnos.filter(t => t.fecha.split('T')[0] === fecha && (!idProf || t.id_profesional === idProf));
  }

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i));
  const profesionalesMostrar = filtroProfesional
    ? profesionales.filter(p => String(p.id) === filtroProfesional)
    : profesionales;

  const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 4, boxSizing: 'border-box', fontSize: '0.9rem' };

  return (
    <>
      <Navbar />
      <div style={{ padding: '1rem', maxWidth: 1400, margin: '0 auto' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>Agenda de Turnos</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isSuperAdmin && <EmpresaSelector />}
            {isAdmin && (
              <>
                <button onClick={() => { setShowGenerar(true); setGenMsg(''); }} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>
                  Generar turnos del día
                </button>
                <Link to="/turnos/config" style={{ background: '#64748b', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none' }}>
                  Configurar agenda
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Modal generar turnos */}
        {showGenerar && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '1.5rem', width: '90%', maxWidth: 420 }}>
              <h3 style={{ margin: '0 0 1rem' }}>Generar turnos del día</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem' }}>
                Crea automáticamente los slots disponibles según la configuración de agenda.
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>Fecha</label>
                <input type="date" value={genFecha} onChange={e => setGenFecha(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>Profesional (opcional)</label>
                <select value={genProfesional} onChange={e => setGenProfesional(e.target.value)} style={inputStyle}>
                  <option value="">Todos</option>
                  {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              {genMsg && <p style={{ color: genMsg.includes('Error') ? '#dc2626' : '#16a34a', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>{genMsg}</p>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={generarTurnos} style={{ background: '#0ea5e9', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 4, cursor: 'pointer' }}>Generar</button>
                <button onClick={() => setShowGenerar(false)} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal asignar turno */}
        {modalTurno && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '1.5rem', width: '90%', maxWidth: 480 }}>
              <h3 style={{ margin: '0 0 0.25rem' }}>Turno: {modalTurno.hora_inicio?.slice(0,5)} – {modalTurno.hora_fin?.slice(0,5)}</h3>
              <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.85rem' }}>{modalTurno.profesional_nombre} · {modalTurno.fecha?.split('T')[0]}</p>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>Estado</label>
                <select value={modalEstado} onChange={e => setModalEstado(e.target.value)} style={inputStyle}>
                  {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>Paciente</label>
                <input
                  placeholder="Buscar por nombre, apellido o DNI..."
                  value={busqPaciente}
                  onChange={e => { setBusqPaciente(e.target.value); cargarPacientes(e.target.value); }}
                  style={{ ...inputStyle, marginBottom: '0.4rem' }}
                />
                <select value={modalPacienteId} onChange={e => setModalPacienteId(e.target.value)} style={inputStyle} size={4}>
                  <option value="">— Sin paciente asignado —</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} {p.dni ? `· DNI ${p.dni}` : ''}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>Notas</label>
                <textarea value={modalNotas} onChange={e => setModalNotas(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {modalError && <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>{modalError}</p>}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={guardarTurno} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: 4, cursor: 'pointer' }}>Guardar</button>
                <button onClick={() => setModalTurno(null)} style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
                {isAdmin && <button onClick={() => eliminarTurno(modalTurno.id)} style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar turno</button>}
              </div>
            </div>
          </div>
        )}

        {/* Controles de navegación */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
            {['semana', 'dia'].map(v => (
              <button key={v} onClick={() => setVista(v)} style={{ padding: '0.4rem 0.9rem', border: 'none', background: vista === v ? '#1e293b' : 'white', color: vista === v ? 'white' : '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: vista === v ? 600 : 400 }}>
                {v === 'semana' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>

          {vista === 'semana' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setSemanaBase(addDays(semanaBase, -7))} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.35rem 0.7rem', borderRadius: 4, cursor: 'pointer' }}>‹</button>
              <span style={{ fontSize: '0.9rem', color: '#475569', minWidth: 180, textAlign: 'center' }}>
                {fechaStr(semanaBase)} — {fechaStr(addDays(semanaBase, 6))}
              </span>
              <button onClick={() => setSemanaBase(addDays(semanaBase, 7))} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.35rem 0.7rem', borderRadius: 4, cursor: 'pointer' }}>›</button>
              <button onClick={() => setSemanaBase(getLunes(new Date()))} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.35rem 0.7rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>Hoy</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => { const d = new Date(fechaDia); d.setDate(d.getDate() - 1); setFechaDia(fechaStr(d)); }} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.35rem 0.7rem', borderRadius: 4, cursor: 'pointer' }}>‹</button>
              <input type="date" value={fechaDia} onChange={e => setFechaDia(e.target.value)} style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.9rem' }} />
              <button onClick={() => { const d = new Date(fechaDia); d.setDate(d.getDate() + 1); setFechaDia(fechaStr(d)); }} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.35rem 0.7rem', borderRadius: 4, cursor: 'pointer' }}>›</button>
              <button onClick={() => setFechaDia(fechaStr(new Date()))} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.35rem 0.7rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', color: '#64748b' }}>Hoy</button>
            </div>
          )}

          <select value={filtroProfesional} onChange={e => setFiltroProfesional(e.target.value)} style={{ padding: '0.4rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: '0.85rem' }}>
            <option value="">Todos los profesionales</option>
            {profesionales.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        {loading && <p style={{ color: '#64748b' }}>Cargando turnos...</p>}

        {/* Vista DÍA */}
        {!loading && vista === 'dia' && (
          profesionalesMostrar.length === 0 ? (
            <EmptyAgenda />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(profesionalesMostrar.length, 3)}, 1fr)`, gap: '1rem' }}>
              {profesionalesMostrar.map(prof => {
                const tProf = turnos.filter(t => t.id_profesional === prof.id);
                return (
                  <div key={prof.id}>
                    <div style={{ background: '#1e293b', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '6px 6px 0 0', fontWeight: 600, fontSize: '0.9rem' }}>
                      {prof.nombre}
                      {prof.especialidad && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.8rem' }}>{prof.especialidad}</span>}
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                      {tProf.length === 0 ? (
                        <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>Sin turnos. Generá los turnos del día.</div>
                      ) : (
                        tProf.map(t => <TurnoCard key={t.id} turno={t} onClick={() => abrirModal(t)} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Vista SEMANA */}
        {!loading && vista === 'semana' && (
          profesionalesMostrar.length === 0 ? (
            <EmptyAgenda />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ width: 120, padding: '0.5rem 0.75rem', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>Profesional</th>
                    {diasSemana.map((d, i) => {
                      const hoy = fechaStr(new Date()) === fechaStr(d);
                      return (
                        <th key={i} style={{ padding: '0.5rem 0.5rem', background: hoy ? '#eff6ff' : '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'center', fontSize: '0.8rem', color: hoy ? '#2563eb' : '#64748b', fontWeight: hoy ? 700 : 600 }}>
                          {DIAS_CORTO[i]}<br /><span style={{ fontWeight: 400 }}>{fechaStr(d).slice(5)}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {profesionalesMostrar.map(prof => (
                    <tr key={prof.id}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top', background: 'white' }}>
                        {prof.nombre}
                        {prof.especialidad && <div style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem' }}>{prof.especialidad}</div>}
                      </td>
                      {diasSemana.map((d, i) => {
                        const tDia = turnosDeDia(fechaStr(d), prof.id);
                        const hoy = fechaStr(new Date()) === fechaStr(d);
                        return (
                          <td key={i} style={{ padding: '0.35rem', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top', background: hoy ? '#fafcff' : 'white', minWidth: 100 }}>
                            {tDia.length === 0 ? (
                              <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>–</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {tDia.map(t => <TurnoChip key={t.id} turno={t} onClick={() => abrirModal(t)} />)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}

function TurnoCard({ turno, onClick }) {
  const est = ESTADOS[turno.estado] || ESTADOS.disponible;
  return (
    <div
      onClick={onClick}
      style={{ padding: '0.6rem 0.85rem', borderLeft: `4px solid ${est.border}`, background: est.bg, cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'filter 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.96)'}
      onMouseLeave={e => e.currentTarget.style.filter = ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{turno.hora_inicio?.slice(0,5)} – {turno.hora_fin?.slice(0,5)}</span>
        <span style={{ fontSize: '0.7rem', color: est.color, fontWeight: 600 }}>{est.label}</span>
      </div>
      {turno.paciente_apellido && (
        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>
          {turno.paciente_apellido}, {turno.paciente_nombre}
          {turno.paciente_telefono && <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>{turno.paciente_telefono}</span>}
        </div>
      )}
      {turno.notas && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{turno.notas}</div>}
    </div>
  );
}

function TurnoChip({ turno, onClick }) {
  const est = ESTADOS[turno.estado] || ESTADOS.disponible;
  return (
    <div
      onClick={onClick}
      title={`${turno.hora_inicio?.slice(0,5)} ${turno.paciente_apellido ? `- ${turno.paciente_apellido}, ${turno.paciente_nombre}` : ''}`}
      style={{ padding: '0.15rem 0.4rem', background: est.bg, border: `1px solid ${est.border}`, borderRadius: 3, fontSize: '0.72rem', cursor: 'pointer', color: est.color, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {turno.hora_inicio?.slice(0,5)} {turno.paciente_apellido ? `· ${turno.paciente_apellido}` : ''}
    </div>
  );
}

function EmptyAgenda() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <p>No hay profesionales activos configurados.</p>
      <Link to="/turnos/profesionales" style={{ color: '#2563eb' }}>Ir a gestión de profesionales</Link>
    </div>
  );
}
