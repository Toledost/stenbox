import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, Save, X, Plus, Settings } from 'lucide-react';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };
const emptyForm = { codigo: '', nombre: '', id_categoria: '', precio: '', stock: '' };

function CampoExtra({ campo, value, onChange }) {
  const style = { width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' };
  if (campo.tipo === 'select') {
    const opts = Array.isArray(campo.opciones) ? campo.opciones : [];
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} required={!!campo.requerido} style={{ ...style, background: 'white' }}>
        <option value="">— Seleccionar —</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input
      type={campo.tipo === 'number' ? 'number' : 'text'}
      step={campo.tipo === 'number' ? 'any' : undefined}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      required={!!campo.requerido}
      style={style}
    />
  );
}

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

function ModalEditar({ form, setForm, atributos, setAtributos, campos, categorias, unidad, onSubmit, onClose, error }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '10px', padding: '1.5rem',
        width: '100%', maxWidth: '460px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Editar producto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: '0 0 90px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Código</label>
              <input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Nombre *</label>
              <input required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Categoría</label>
            <SelectCategoria value={form.id_categoria} onChange={e => setForm(p => ({ ...p, id_categoria: e.target.value }))} categorias={categorias} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Precio x {unidad} *</label>
              <input required type="number" step="0.01" min="0" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Stock ({unidad})</label>
              <input type="number" step="0.001" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {campos.map(campo => (
            <div key={campo.id}>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                {campo.label}{campo.requerido ? ' *' : ''}
              </label>
              <CampoExtra campo={campo} value={atributos[campo.id] ?? ''} onChange={val => setAtributos(prev => ({ ...prev, [campo.id]: val }))} />
            </div>
          ))}

          {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <X size={15} /> Cancelar
            </button>
            <button type="submit" style={{ padding: '0.5rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Save size={15} /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductoCard({ p, campos, unidad, isAdmin, onEditar, onEliminar }) {
  const stockNum = Number(p.stock);
  const stockColor = stockNum <= 0 ? '#ef4444' : stockNum < 5 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {p.codigo && <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '0.4rem' }}>{p.codigo}</span>}
          <span style={{ fontWeight: '600' }}>{p.nombre}</span>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={() => onEditar(p)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}><Pencil size={13} /></button>
            <button onClick={() => onEliminar(p.id)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}><Trash2 size={13} /></button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
        <span style={{ color: '#475569' }}>Precio: <strong>${Number(p.precio).toLocaleString('es-AR')}/{unidad}</strong></span>
        <span style={{ color: stockColor, fontWeight: '600' }}>{stockNum <= 0 ? 'Sin stock' : `${Number(p.stock).toFixed(3)} ${unidad}`}</span>
      </div>
      {campos.map(c => p.atributos?.[c.id] != null && (
        <div key={c.id} style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.label}: {p.atributos[c.id]}</div>
      ))}
    </div>
  );
}

export default function InventarioPage() {
  const { isAdmin } = useAuth();
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const isMobile = useIsMobile();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [campos, setCampos] = useState([]);
  const [unidad, setUnidad] = useState('kg');
  const [form, setForm] = useState(emptyForm);
  const [atributosForm, setAtributosForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [editAtributos, setEditAtributos] = useState({});
  const [error, setError] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);

  async function cargar() {
    if (!empresaId) return;
    const [{ data: prods }, { data: cats }, { data: cams }, { data: cfg }] = await Promise.all([
      api.get(`/productos${empresaParam}`),
      api.get(`/categorias${empresaParam}`),
      api.get(`/campos${empresaParam}`),
      api.get(`/empresas/config${empresaParam}`),
    ]);
    setProductos(prods);
    setCategorias(cats);
    setCampos(cams);
    setUnidad(cfg.unidad_stock || 'kg');
  }

  useEffect(() => { cargar(); }, [empresaId]);

  async function handleSubmitNuevo(e) {
    e.preventDefault();
    setError('');
    try {
      const { data: nuevo } = await api.post(`/productos${empresaParam}`, form);
      if (Object.keys(atributosForm).length > 0) {
        const atributos = Object.entries(atributosForm).map(([id_campo, valor]) => ({ id_campo: Number(id_campo), valor }));
        await api.put(`/campos/atributos/${nuevo.id}${empresaParam}`, { atributos });
      }
      setForm(emptyForm);
      setAtributosForm({});
      if (isMobile) setMostrarFormNuevo(false);
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
      const atributos = Object.entries(editAtributos).map(([id_campo, valor]) => ({ id_campo: Number(id_campo), valor }));
      await api.put(`/campos/atributos/${editId}${empresaParam}`, { atributos });
      setEditId(null);
      setForm(emptyForm);
      setEditAtributos({});
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  function iniciarEdicion(p) {
    setError('');
    setEditId(p.id);
    setForm({ codigo: p.codigo || '', nombre: p.nombre, id_categoria: p.id_categoria || '', precio: p.precio, stock: p.stock });
    setEditAtributos(p.atributos || {});
  }

  function cerrarModal() {
    setEditId(null);
    setForm(emptyForm);
    setEditAtributos({});
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

  const inputStyle = { padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', boxSizing: 'border-box', fontSize: '1rem' };

  return (
    <>
      <Navbar />

      {editId && (
        <ModalEditar
          form={form} setForm={setForm}
          atributos={editAtributos} setAtributos={setEditAtributos}
          campos={campos} categorias={categorias} unidad={unidad}
          onSubmit={handleSubmitEditar} onClose={cerrarModal} error={error}
        />
      )}

      <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Inventario</h2>
          {isAdmin && (
            <Link to="/inventario/campos" style={{ padding: '0.4rem 0.9rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
              <Settings size={15} />{!isMobile && ' Campos personalizados'}
            </Link>
          )}
        </div>

        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {isAdmin && (
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            {isMobile ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Agregar producto</h3>
                  <button onClick={() => setMostrarFormNuevo(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '1.4rem', lineHeight: 1 }}>
                    {mostrarFormNuevo ? '−' : '+'}
                  </button>
                </div>
                {mostrarFormNuevo && (
                  <form onSubmit={handleSubmitNuevo} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                    <div><label style={{ fontSize: '0.75rem', color: '#64748b' }}>Código</label><input placeholder="Ej: V001" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} style={inputStyle} /></div>
                    <div><label style={{ fontSize: '0.75rem', color: '#64748b' }}>Nombre *</label><input placeholder="Ej: Costilla" required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={inputStyle} /></div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Categoría</label>
                      <select value={form.id_categoria} onChange={e => setForm(p => ({ ...p, id_categoria: e.target.value }))} style={{ ...inputStyle, background: 'white' }}>
                        <option value="">— Sin categoría —</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div><label style={{ fontSize: '0.75rem', color: '#64748b' }}>Precio x {unidad} *</label><input placeholder="0.00" type="number" step="0.01" required value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} style={inputStyle} /></div>
                    <div><label style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock ({unidad})</label><input placeholder="0.000" type="number" step="0.001" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={inputStyle} /></div>
                    {campos.map(campo => (
                      <div key={campo.id}>
                        <label style={{ fontSize: '0.75rem', color: '#64748b' }}>{campo.label}{campo.requerido ? ' *' : ''}</label>
                        <CampoExtra campo={campo} value={atributosForm[campo.id] ?? ''} onChange={val => setAtributosForm(prev => ({ ...prev, [campo.id]: val }))} />
                      </div>
                    ))}
                    {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</span>}
                    <button type="submit" style={{ padding: '0.6rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '1rem' }}>
                      <Plus size={15} /> Agregar
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
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
                    <select value={form.id_categoria} onChange={e => setForm(p => ({ ...p, id_categoria: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '140px', background: 'white' }}>
                      <option value="">— Sin categoría —</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Precio x {unidad} *</label>
                    <input placeholder="0.00" type="number" step="0.01" required value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '110px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock ({unidad})</label>
                    <input placeholder="0.000" type="number" step="0.001" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '90px' }} />
                  </div>
                  {campos.map(campo => (
                    <div key={campo.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>{campo.label}{campo.requerido ? ' *' : ''}</label>
                      <div style={{ minWidth: '120px' }}>
                        <CampoExtra campo={campo} value={atributosForm[campo.id] ?? ''} onChange={val => setAtributosForm(prev => ({ ...prev, [campo.id]: val }))} />
                      </div>
                    </div>
                  ))}
                  <button type="submit" style={{ padding: '0.45rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Plus size={15} /> Agregar
                  </button>
                  {!editId && error && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{error}</span>}
                </form>
              </>
            )}
          </div>
        )}

        {/* Filtros por categoría */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Filtrar:</span>
          <button onClick={() => setFiltroCategoria('')} style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', background: filtroCategoria === '' ? '#1e293b' : 'white', color: filtroCategoria === '' ? 'white' : '#1e293b', fontSize: '0.8rem' }}>
            Todos ({productos.length})
          </button>
          {categorias.map(cat => (
            <button key={cat.id} onClick={() => setFiltroCategoria(filtroCategoria === cat.id ? '' : cat.id)} style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', background: filtroCategoria === cat.id ? '#1e293b' : 'white', color: filtroCategoria === cat.id ? 'white' : '#1e293b', fontSize: '0.8rem' }}>
              {cat.nombre} ({productos.filter(p => p.id_categoria === cat.id).length})
            </button>
          ))}
        </div>

        {/* Lista / Tabla */}
        {Object.entries(grupos).map(([categoria, items]) => (
          <div key={categoria} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {categoria} <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>({items.length})</span>
            </h3>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map(p => (
                  <ProductoCard key={p.id} p={p} campos={campos} unidad={unidad} isAdmin={isAdmin} onEditar={iniciarEdicion} onEliminar={eliminar} />
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Código</th>
                    <th style={thStyle}>Nombre</th>
                    {campos.map(c => <th key={c.id} style={thStyle}>{c.label}</th>)}
                    <th style={{ ...thStyle, textAlign: 'right' }}>Precio x {unidad}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Stock ({unidad})</th>
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
                        {campos.map(c => <td key={c.id} style={{ ...tdStyle, color: '#475569' }}>{p.atributos?.[c.id] ?? '—'}</td>)}
                        <td style={{ ...tdStyle, textAlign: 'right' }}>${Number(p.precio).toLocaleString('es-AR')}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: stockColor, fontWeight: '600' }}>
                          {stockNum <= 0 ? 'Sin stock' : `${Number(p.stock).toFixed(3)} ${unidad}`}
                        </td>
                        {isAdmin && (
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                              <button onClick={() => iniciarEdicion(p)} style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Pencil size={13} /> Editar</button>
                              <button onClick={() => eliminar(p.id)} style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Trash2 size={13} /> Eliminar</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}

        {productosFiltrados.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No hay productos cargados.</p>
        )}
      </div>
    </>
  );
}
