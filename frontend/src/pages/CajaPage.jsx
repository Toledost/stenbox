import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Trash2, CheckCircle, Settings } from 'lucide-react';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };

function MovimientoCard({ m, unidad, isAdmin, onEliminar, esEntrada }) {
  const entrada = esEntrada(m);
  const tipoDisplay = m.tipo_label || m.tipo;
  return (
    <div style={{ background: 'white', border: `1px solid ${entrada ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: '600', color: entrada ? '#22c55e' : '#ef4444' }}>{tipoDisplay}</span>
        <span style={{ fontWeight: '700', color: entrada ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
          {entrada ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
        </span>
      </div>
      {m.producto_nombre && (
        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
          {m.producto_codigo ? `[${m.producto_codigo}] ` : ''}{m.producto_nombre}
          {m.cantidad != null && <span style={{ color: '#94a3b8' }}> · {Number(m.cantidad).toFixed(2)} {unidad}</span>}
        </div>
      )}
      {m.descripcion && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{m.descripcion}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
        <span>{new Date(m.fecha).toLocaleString('es-AR')} · {m.usuario_nombre}</span>
        {isAdmin && (
          <button onClick={() => onEliminar(m.id)} style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CajaPage() {
  const { isAdmin, hasModulo } = useAuth();
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({ total_ingresos: 0, total_egresos: 0, saldo: 0 });
  const [productos, setProductos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [unidad, setUnidad] = useState('kg');
  const [form, setForm] = useState({ id_tipo_movimiento: '', id_producto: '', cantidad: '', precio_unit: '', monto: '', descripcion: '' });
  const [error, setError] = useState('');

  const tieneInventario = hasModulo('inventario');
  const tipoSeleccionado = tiposMovimiento.find(t => String(t.id) === String(form.id_tipo_movimiento));
  const usaProducto = tieneInventario && tipoSeleccionado?.afecta_stock;
  const montoCalculado = usaProducto && form.cantidad && form.precio_unit
    ? (Number(form.cantidad) * Number(form.precio_unit)).toFixed(2)
    : null;
  const prodSeleccionado = productos.find(p => String(p.id) === String(form.id_producto));

  async function cargar() {
    if (!empresaId) return;
    const requests = [
      api.get(`/caja${empresaParam}`),
      api.get(`/caja/resumen${empresaParam}`),
      api.get(`/tipos-movimiento${empresaParam}`),
      api.get(`/empresas/config${empresaParam}`),
    ];
    if (tieneInventario) requests.push(api.get(`/productos${empresaParam}`));
    const [mov, res, tipos, cfg, prods] = await Promise.all(requests);
    setMovimientos(mov.data);
    setResumen(res.data);
    setTiposMovimiento(tipos.data.filter(t => t.activo));
    setUnidad(cfg.data.unidad_stock || 'kg');
    if (prods) setProductos(prods.data);
  }

  useEffect(() => { cargar(); }, [empresaId]);

  function handleTipoChange(e) {
    setForm({ id_tipo_movimiento: e.target.value, id_producto: '', cantidad: '', precio_unit: '', monto: '', descripcion: '' });
  }

  function handleProductoChange(e) {
    const id = e.target.value;
    const prod = productos.find(p => String(p.id) === String(id));
    setForm(f => ({ ...f, id_producto: id, precio_unit: prod ? prod.precio : '' }));
  }

  async function eliminarMovimiento(id) {
    if (!confirm('¿Eliminar este movimiento? Se revertirá el stock si aplica.')) return;
    try {
      await api.delete(`/caja/${id}${empresaParam}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = usaProducto
        ? { id_tipo_movimiento: form.id_tipo_movimiento, id_producto: form.id_producto, cantidad: form.cantidad, precio_unit: form.precio_unit, descripcion: form.descripcion }
        : { id_tipo_movimiento: form.id_tipo_movimiento, monto: form.monto, descripcion: form.descripcion };
      await api.post(`/caja${empresaParam}`, payload);
      setForm({ id_tipo_movimiento: form.id_tipo_movimiento, id_producto: '', cantidad: '', precio_unit: '', monto: '', descripcion: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  function esEntrada(m) {
    if (m.id_tipo_movimiento != null) return !!m.es_entrada;
    return m.tipo === 'venta' || m.tipo === 'ingreso';
  }

  const inputStyle = { padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', boxSizing: 'border-box', fontSize: '1rem', background: 'white' };

  return (
    <>
      <Navbar />
      <div style={{ padding: isMobile ? '1rem' : '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Caja</h2>
          {isAdmin && (
            <button onClick={() => navigate('/caja/tipos')} style={{ padding: '0.4rem 0.9rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
              <Settings size={15} />{!isMobile && ' Tipos de movimiento'}
            </button>
          )}
        </div>
        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {/* Resumen */}
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
          {[['Ingresos', resumen.total_ingresos, '#22c55e'], ['Egresos', resumen.total_egresos, '#ef4444'], ['Saldo', resumen.saldo, '#1e293b']].map(([label, val, color]) => (
            <div key={label} style={{ padding: isMobile ? '0.75rem' : '1rem', background: 'white', borderRadius: '8px', border: `2px solid ${color}` }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{label}</div>
              <div style={{ color, fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.25rem' }}>${Number(val || 0).toLocaleString('es-AR')}</div>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Registrar movimiento</h3>
          {tiposMovimiento.length === 0 ? (
            <p style={{ color: '#94a3b8', margin: 0 }}>
              No hay tipos de movimiento configurados.{isAdmin && <> <button onClick={() => navigate('/caja/tipos')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}>Configurar ahora</button></>}
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem', flexWrap: isMobile ? 'nowrap' : 'wrap', alignItems: isMobile ? 'stretch' : 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: isMobile ? undefined : undefined }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Tipo *</label>
                <select required value={form.id_tipo_movimiento} onChange={handleTipoChange} style={{ ...inputStyle, minWidth: isMobile ? undefined : '200px' }}>
                  <option value="">— Seleccionar —</option>
                  {tiposMovimiento.map(t => (
                    <option key={t.id} value={t.id}>{t.label} ({t.es_entrada ? 'Ingreso' : 'Egreso'}{t.afecta_stock ? ' + stock' : ''})</option>
                  ))}
                </select>
              </div>

              {usaProducto && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Producto *</label>
                    <select required value={form.id_producto} onChange={handleProductoChange} style={{ ...inputStyle, minWidth: isMobile ? undefined : '180px' }}>
                      <option value="">— Seleccionar —</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre} — Stock: {Number(p.stock).toFixed(2)} {unidad}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Cant. ({unidad}) *
                        {prodSeleccionado && tipoSeleccionado?.es_entrada && (
                          <span style={{ color: Number(prodSeleccionado.stock) < Number(form.cantidad || 0) ? '#ef4444' : '#22c55e', marginLeft: '0.4rem' }}>
                            Stock: {Number(prodSeleccionado.stock).toFixed(2)}
                          </span>
                        )}
                      </label>
                      <input required type="number" step="0.001" min="0.001" placeholder="0.000" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Precio x {unidad} *</label>
                      <input required type="number" step="0.01" min="0" placeholder="0.00" value={form.precio_unit} onChange={e => setForm(f => ({ ...f, precio_unit: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>

                  {montoCalculado && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</label>
                      <div style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: '600', color: tipoSeleccionado?.es_entrada ? '#22c55e' : '#ef4444' }}>
                        ${Number(montoCalculado).toLocaleString('es-AR')}
                      </div>
                    </div>
                  )}
                </>
              )}

              {form.id_tipo_movimiento && !usaProducto && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Monto *</label>
                  <input required type="number" step="0.01" min="0" placeholder="0.00" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} style={inputStyle} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: isMobile ? undefined : '180px' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Descripción</label>
                <input placeholder="Opcional" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} style={inputStyle} />
              </div>

              <button type="submit" style={{ padding: isMobile ? '0.65rem' : '0.45rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: isMobile ? '1rem' : undefined }}>
                <CheckCircle size={16} /> Registrar
              </button>
              {error && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{error}</span>}
            </form>
          )}
        </div>

        {/* Lista / Tabla */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {movimientos.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Sin movimientos registrados</p>}
            {movimientos.map(m => (
              <MovimientoCard key={m.id} m={m} unidad={unidad} isAdmin={isAdmin} onEliminar={eliminarMovimiento} esEntrada={esEntrada} />
            ))}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Producto</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cant. ({unidad})</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Precio x {unidad}</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Usuario</th>
                {isAdmin && <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => {
                const entrada = esEntrada(m);
                const tipoDisplay = m.tipo_label || m.tipo;
                return (
                  <tr key={m.id}>
                    <td style={tdStyle}>{new Date(m.fecha).toLocaleString('es-AR')}</td>
                    <td style={{ ...tdStyle, color: entrada ? '#22c55e' : '#ef4444', fontWeight: '600' }}>{tipoDisplay}</td>
                    <td style={tdStyle}>{m.producto_nombre ? `${m.producto_codigo ? `[${m.producto_codigo}] ` : ''}${m.producto_nombre}` : '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{m.cantidad != null ? Number(m.cantidad).toFixed(2) : '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{m.precio_unit != null ? `$${Number(m.precio_unit).toLocaleString('es-AR')}` : '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: entrada ? '#22c55e' : '#ef4444' }}>
                      {entrada ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
                    </td>
                    <td style={tdStyle}>{m.descripcion || '-'}</td>
                    <td style={tdStyle}>{m.usuario_nombre}</td>
                    {isAdmin && (
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button onClick={() => eliminarMovimiento(m.id)} style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {movimientos.length === 0 && (
                <tr><td colSpan={isAdmin ? 9 : 8} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>Sin movimientos registrados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
