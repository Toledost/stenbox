import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import { Plus, Trash2, Save, X } from 'lucide-react';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };

const emptyForm = { nombre: '', label: '', es_entrada: true, afecta_stock: false, orden: 0 };

export default function TiposMovimientoPage() {
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const [tipos, setTipos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    if (!empresaId) return;
    const { data } = await api.get(`/tipos-movimiento${empresaParam}`);
    setTipos(data);
  }

  useEffect(() => { cargar(); }, [empresaId]);

  async function handleCrear(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/tipos-movimiento${empresaParam}`, form);
      setForm(emptyForm);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  function iniciarEdicion(t) {
    setEditId(t.id);
    setEditForm({ nombre: t.nombre, label: t.label, es_entrada: !!t.es_entrada, afecta_stock: !!t.afecta_stock, activo: !!t.activo, orden: t.orden });
  }

  async function handleGuardar(id) {
    try {
      await api.put(`/tipos-movimiento/${id}${empresaParam}`, editForm);
      setEditId(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este tipo? Los movimientos existentes conservarán su datos.')) return;
    await api.delete(`/tipos-movimiento/${id}${empresaParam}`);
    cargar();
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Tipos de movimiento de caja</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Define los tipos de movimiento disponibles en la caja. Cada tipo tiene una dirección (ingreso o egreso) y puede opcionalmente afectar el stock de un producto.
        </p>
        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {/* Formulario nuevo */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Agregar tipo</h3>
          <form onSubmit={handleCrear} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Nombre interno *</label>
              <input
                required
                placeholder="ej: venta_contado"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '160px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Etiqueta (visible) *</label>
              <input
                required
                placeholder="ej: Venta al contado"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '200px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Dirección *</label>
              <select
                value={form.es_entrada ? 'entrada' : 'salida'}
                onChange={e => setForm(f => ({ ...f, es_entrada: e.target.value === 'entrada' }))}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="entrada">Ingreso (entrada de dinero)</option>
                <option value="salida">Egreso (salida de dinero)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>¿Afecta stock?</label>
              <select
                value={form.afecta_stock ? '1' : '0'}
                onChange={e => setForm(f => ({ ...f, afecta_stock: e.target.value === '1' }))}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="0">No</option>
                <option value="1">Sí (requiere producto)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Orden</label>
              <input
                type="number"
                min="0"
                value={form.orden}
                onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '70px' }}
              />
            </div>
            <button type="submit" style={{ padding: '0.45rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Agregar
            </button>
            {error && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{error}</span>}
          </form>
        </div>

        {/* Tabla */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre interno</th>
              <th style={thStyle}>Etiqueta</th>
              <th style={thStyle}>Dirección</th>
              <th style={thStyle}>Afecta stock</th>
              <th style={thStyle}>Activo</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Orden</th>
              <th style={{ ...thStyle, width: '100px' }}></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map(t => editId === t.id ? (
              <tr key={t.id} style={{ background: '#f0f9ff' }}>
                <td style={tdStyle}>
                  <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                    style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '140px' }} />
                </td>
                <td style={tdStyle}>
                  <input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                    style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '180px' }} />
                </td>
                <td style={tdStyle}>
                  <select value={editForm.es_entrada ? 'entrada' : 'salida'} onChange={e => setEditForm(f => ({ ...f, es_entrada: e.target.value === 'entrada' }))}
                    style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="entrada">Ingreso</option>
                    <option value="salida">Egreso</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select value={editForm.afecta_stock ? '1' : '0'} onChange={e => setEditForm(f => ({ ...f, afecta_stock: e.target.value === '1' }))}
                    style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="0">No</option>
                    <option value="1">Sí</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select value={editForm.activo ? '1' : '0'} onChange={e => setEditForm(f => ({ ...f, activo: e.target.value === '1' }))}
                    style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <input type="number" min="0" value={editForm.orden} onChange={e => setEditForm(f => ({ ...f, orden: Number(e.target.value) }))}
                    style={{ padding: '0.3rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '60px' }} />
                </td>
                <td style={{ ...tdStyle, display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => handleGuardar(t.id)} style={{ padding: '0.25rem 0.6rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><Save size={14} /></button>
                  <button onClick={() => setEditId(null)} style={{ padding: '0.25rem 0.6rem', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><X size={14} /></button>
                </td>
              </tr>
            ) : (
              <tr key={t.id} style={{ opacity: t.activo ? 1 : 0.5 }}>
                <td style={tdStyle}><code style={{ fontSize: '0.85rem' }}>{t.nombre}</code></td>
                <td style={tdStyle}>{t.label}</td>
                <td style={{ ...tdStyle, color: t.es_entrada ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {t.es_entrada ? 'Ingreso' : 'Egreso'}
                </td>
                <td style={tdStyle}>{t.afecta_stock ? '✓ Sí' : 'No'}</td>
                <td style={tdStyle}>{t.activo ? 'Sí' : 'No'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{t.orden}</td>
                <td style={{ ...tdStyle, display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => iniciarEdicion(t)} style={{ padding: '0.25rem 0.6rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Editar</button>
                  <button onClick={() => handleEliminar(t.id)} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {tipos.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>Sin tipos definidos. Agrega al menos uno para poder registrar movimientos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
