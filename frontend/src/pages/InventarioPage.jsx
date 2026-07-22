import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };
const emptyForm = { codigo: '', nombre: '', id_categoria: '', precio: '', stock: '' };

function SelectCategoria({ value, onChange, categorias, required }) {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', background: 'white' }}
    >
      <option value="">— Sin categoría —</option>
      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
    </select>
  );
}

function ModalEditar({ form, setForm, categorias, onSubmit, onClose, error }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '10px', padding: '1.5rem',
        width: '100%', maxWidth: '420px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Editar producto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: '0 0 90px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Código</label>
              <input
                value={form.codigo}
                onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
                style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Categoría</label>
            <SelectCategoria
              value={form.id_categoria}
              onChange={e => setForm(p => ({ ...p, id_categoria: e.target.value }))}
              categorias={categorias}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Precio x kg *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
                style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Stock (kg)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.stock}
                onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              title="Descartar cambios y cerrar"
              style={{ padding: '0.5rem 1rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <X size={15} /> Cancelar
            </button>
            <button
              type="submit"
              title="Guardar cambios del producto"
              style={{ padding: '0.5rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Save size={15} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventarioPage() {
  const { isAdmin } = useAuth();
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  async function cargar() {
    if (!empresaId) return;
    const [{ data: prods }, { data: cats }] = await Promise.all([
      api.get(`/productos${empresaParam}`),
      api.get(`/categorias${empresaParam}`),
    ]);
    setProductos(prods);
    setCategorias(cats);
  }

  useEffect(() => { cargar(); }, [empresaId]);

  async function handleSubmitNuevo(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/productos${empresaParam}`, form);
      setForm(emptyForm);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  async function handleSubmitEditar(e) {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/productos/${editId}${empresaParam}`, form);
      setEditId(null);
      setForm(emptyForm);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  function iniciarEdicion(p) {
    setError('');
    setEditId(p.id);
    setForm({ codigo: p.codigo || '', nombre: p.nombre, id_categoria: p.id_categoria || '', precio: p.precio, stock: p.stock });
  }

  function cerrarModal() {
    setEditId(null);
    setForm(emptyForm);
    setError('');
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar producto?')) return;
    await api.delete(`/productos/${id}${empresaParam}`);
    cargar();
  }

  const productosFiltrados = filtroCategoria
    ? productos.filter(p => p.id_categoria === filtroCategoria)
    : productos;

  const grupos = productosFiltrados.reduce((acc, p) => {
    const cat = p.categoria || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <>
      <Navbar />

      {editId && (
        <ModalEditar
          form={form}
          setForm={setForm}
          categorias={categorias}
          onSubmit={handleSubmitEditar}
          onClose={cerrarModal}
          error={error}
        />
      )}

      <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>Inventario</h2>
        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {isAdmin && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Agregar producto</h3>
            <form onSubmit={handleSubmitNuevo} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Código</label>
                <input placeholder="Ej: V001" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '80px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Nombre *</label>
                <input placeholder="Ej: Costilla" required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '160px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Categoría</label>
                <select
                  value={form.id_categoria}
                  onChange={e => setForm(p => ({ ...p, id_categoria: e.target.value }))}
                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '140px', background: 'white' }}
                >
                  <option value="">— Sin categoría —</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Precio *</label>
                <input placeholder="0.00" type="number" step="0.01" required value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '110px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock (kg)</label>
                <input placeholder="0.000" type="number" step="0.001" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '90px' }} />
              </div>
              <button type="submit" title="Agregar producto al inventario" style={{ padding: '0.45rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Plus size={15} /> Agregar
              </button>
              {!editId && error && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{error}</span>}
            </form>
          </div>
        )}

        {/* Filtros por categoría */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Filtrar:</span>
          <button
            onClick={() => setFiltroCategoria('')}
            style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', background: filtroCategoria === '' ? '#1e293b' : 'white', color: filtroCategoria === '' ? 'white' : '#1e293b', fontSize: '0.8rem' }}
          >
            Todos ({productos.length})
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(filtroCategoria === cat.id ? '' : cat.id)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', background: filtroCategoria === cat.id ? '#1e293b' : 'white', color: filtroCategoria === cat.id ? 'white' : '#1e293b', fontSize: '0.8rem' }}
            >
              {cat.nombre} ({productos.filter(p => p.id_categoria === cat.id).length})
            </button>
          ))}
        </div>

        {/* Tabla agrupada */}
        {Object.entries(grupos).map(([categoria, items]) => (
          <div key={categoria} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {categoria} <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>({items.length})</span>
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Código</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Precio x kg</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Stock (kg)</th>
                  {isAdmin && <th style={{ ...thStyle, textAlign: 'center', width: '120px' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(p => {
                  const stockNum = Number(p.stock);
                  const stockColor = stockNum <= 0 ? '#ef4444' : stockNum < 5 ? '#f59e0b' : '#22c55e';
                  return (
                    <tr key={p.id} style={{ background: 'white' }}>
                      <td style={tdStyle}>{p.codigo || '-'}</td>
                      <td style={tdStyle}>{p.nombre}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>${Number(p.precio).toLocaleString('es-AR')}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: stockColor, fontWeight: '600' }}>
                        {stockNum <= 0 ? 'Sin stock' : `${Number(p.stock).toFixed(3)} kg`}
                      </td>
                      {isAdmin && (
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button onClick={() => iniciarEdicion(p)} title="Editar precio, stock y categoría del producto" style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Pencil size={13} /> Editar</button>
                            <button onClick={() => eliminar(p.id)} title="Eliminar producto del inventario" style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Trash2 size={13} /> Eliminar</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {productosFiltrados.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No hay productos cargados.</p>
        )}
      </div>
    </>
  );
}
