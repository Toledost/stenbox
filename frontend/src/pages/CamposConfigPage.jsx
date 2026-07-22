import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };

const TIPOS = [
  { value: 'text', label: 'Texto libre' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Lista de opciones' },
];

const emptyForm = { nombre: '', label: '', tipo: 'text', opciones: '', requerido: false, orden: 0 };

const UNIDADES_PREDEFINIDAS = ['kg', 'unidad', 'litro', 'metro', 'hora', 'caja', 'bolsa', 'tonelada'];
const OTRA_UNIDAD = '__otra__';

function parsearOpciones(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

export default function CamposConfigPage() {
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const [campos, setCampos] = useState([]);
  const [unidad, setUnidad] = useState('kg');
  const [unidadSelect, setUnidadSelect] = useState('kg');
  const [unidadCustom, setUnidadCustom] = useState('');
  const [unidadGuardada, setUnidadGuardada] = useState(false);

  const unidadEdit = unidadSelect === OTRA_UNIDAD ? unidadCustom : unidadSelect;
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [errorEdit, setErrorEdit] = useState('');

  async function cargar() {
    if (!empresaId) return;
    const [{ data: cams }, { data: cfg }] = await Promise.all([
      api.get(`/campos${empresaParam}`),
      api.get(`/empresas/config${empresaParam}`),
    ]);
    setCampos(cams);
    const u = cfg.unidad_stock || 'kg';
    setUnidad(u);
    if (UNIDADES_PREDEFINIDAS.includes(u)) {
      setUnidadSelect(u);
      setUnidadCustom('');
    } else {
      setUnidadSelect(OTRA_UNIDAD);
      setUnidadCustom(u);
    }
  }

  useEffect(() => { cargar(); }, [empresaId]);

  async function handleGuardarUnidad(e) {
    e.preventDefault();
    const valor = unidadEdit.trim();
    if (!valor) return;
    await api.put(`/empresas/config${empresaParam}`, { unidad_stock: valor });
    setUnidad(valor);
    setUnidadGuardada(true);
    setTimeout(() => setUnidadGuardada(false), 2000);
  }

  async function handleAgregar(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        opciones: form.tipo === 'select' ? parsearOpciones(form.opciones) : null,
        requerido: form.requerido ? 1 : 0,
      };
      await api.post(`/campos${empresaParam}`, payload);
      setForm(emptyForm);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  function iniciarEdicion(c) {
    setEditId(c.id);
    setEditForm({
      nombre: c.nombre,
      label: c.label,
      tipo: c.tipo,
      opciones: Array.isArray(c.opciones) ? c.opciones.join(', ') : (c.opciones || ''),
      requerido: !!c.requerido,
      orden: c.orden,
    });
    setErrorEdit('');
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorEdit('');
    try {
      const payload = {
        ...editForm,
        opciones: editForm.tipo === 'select' ? parsearOpciones(editForm.opciones) : null,
        requerido: editForm.requerido ? 1 : 0,
      };
      await api.put(`/campos/${editId}${empresaParam}`, payload);
      setEditId(null);
      cargar();
    } catch (err) {
      setErrorEdit(err.response?.data?.message || 'Error');
    }
  }

  async function handleEliminar(c) {
    if (!confirm(`¿Eliminar el campo "${c.label}"? Se perderán todos sus valores en los productos.`)) return;
    try {
      await api.delete(`/campos/${c.id}${empresaParam}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Campos personalizados de producto</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Definí los campos extra que se mostrarán en el formulario de productos para esta empresa.
        </p>

        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {/* Unidad de medida */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Unidad de medida</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
            Se usa en "Precio x <strong>{unidad}</strong>" y "Stock (<strong>{unidad}</strong>)" en inventario y caja.
          </p>
          <form onSubmit={handleGuardarUnidad} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={unidadSelect}
              onChange={e => setUnidadSelect(e.target.value)}
              style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
            >
              {UNIDADES_PREDEFINIDAS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
              <option value={OTRA_UNIDAD}>Otra (personalizada)…</option>
            </select>
            {unidadSelect === OTRA_UNIDAD && (
              <input
                required
                autoFocus
                placeholder="ej: paleta, rollo, docena"
                value={unidadCustom}
                onChange={e => setUnidadCustom(e.target.value)}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '180px' }}
              />
            )}
            <button
              type="submit"
              title="Guardar unidad de medida"
              disabled={unidadSelect === OTRA_UNIDAD && !unidadCustom.trim()}
              style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', opacity: unidadSelect === OTRA_UNIDAD && !unidadCustom.trim() ? 0.5 : 1 }}
            >
              <Save size={14} /> Guardar
            </button>
            {unidadGuardada && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>¡Guardado!</span>}
          </form>
        </div>

        {/* Formulario agregar */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Nuevo campo</h3>
          <form onSubmit={handleAgregar}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Nombre interno *</label>
                <input
                  required
                  placeholder="ej: origen"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '140px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Etiqueta visible *</label>
                <input
                  required
                  placeholder="ej: Origen"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '160px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                >
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.requerido} onChange={e => setForm(f => ({ ...f, requerido: e.target.checked }))} />
                  Requerido
                </label>
              </div>
            </div>
            {form.tipo === 'select' && (
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                  Opciones (separadas por coma) *
                </label>
                <input
                  required
                  placeholder="ej: Vacuno, Cerdo, Pollo"
                  value={form.opciones}
                  onChange={e => setForm(f => ({ ...f, opciones: e.target.value }))}
                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <button
              type="submit"
              title="Agregar nuevo campo personalizado"
              style={{ padding: '0.45rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus size={15} /> Agregar campo
            </button>
            {error && <p style={{ color: '#ef4444', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{error}</p>}
          </form>
        </div>

        {/* Tabla de campos */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>#</th>
              <th style={thStyle}>Nombre interno</th>
              <th style={thStyle}>Etiqueta</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Opciones</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Req.</th>
              <th style={{ ...thStyle, textAlign: 'center', width: '160px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campos.map(c => (
              <tr key={c.id}>
                {editId === c.id ? (
                  <td colSpan={7} style={tdStyle}>
                    <form onSubmit={handleGuardar} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Etiqueta *</label>
                        <input
                          required
                          value={editForm.label}
                          onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                          style={{ padding: '0.35rem', border: '1px solid #94a3b8', borderRadius: '4px', width: '150px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Tipo</label>
                        <select
                          value={editForm.tipo}
                          onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}
                          style={{ padding: '0.35rem', border: '1px solid #94a3b8', borderRadius: '4px' }}
                        >
                          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      {editForm.tipo === 'select' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Opciones</label>
                          <input
                            value={editForm.opciones}
                            onChange={e => setEditForm(f => ({ ...f, opciones: e.target.value }))}
                            style={{ padding: '0.35rem', border: '1px solid #94a3b8', borderRadius: '4px', width: '200px' }}
                          />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Orden</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.orden}
                          onChange={e => setEditForm(f => ({ ...f, orden: Number(e.target.value) }))}
                          style={{ padding: '0.35rem', border: '1px solid #94a3b8', borderRadius: '4px', width: '60px' }}
                        />
                      </div>
                      <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editForm.requerido} onChange={e => setEditForm(f => ({ ...f, requerido: e.target.checked }))} />
                        Req.
                      </label>
                      <button type="submit" title="Guardar cambios del campo" style={{ padding: '0.35rem 0.75rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <Save size={13} /> Guardar
                      </button>
                      <button type="button" onClick={() => setEditId(null)} title="Cancelar edición" style={{ padding: '0.35rem 0.6rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontSize: '0.8rem' }}>
                        <X size={13} />
                      </button>
                      {errorEdit && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errorEdit}</span>}
                    </form>
                  </td>
                ) : (
                  <>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>{c.orden}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>{c.nombre}</td>
                    <td style={tdStyle}>{c.label}</td>
                    <td style={tdStyle}>{TIPOS.find(t => t.value === c.tipo)?.label || c.tipo}</td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#64748b' }}>
                      {c.tipo === 'select' && Array.isArray(c.opciones) ? c.opciones.join(', ') : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {c.requerido ? <span style={{ color: '#22c55e', fontWeight: '600' }}>Sí</span> : <span style={{ color: '#94a3b8' }}>No</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button onClick={() => iniciarEdicion(c)} title="Editar este campo" style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Pencil size={13} /> Editar
                        </button>
                        <button onClick={() => handleEliminar(c)} title="Eliminar este campo" style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {campos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>
                  No hay campos personalizados configurados para esta empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
