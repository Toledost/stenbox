import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Trash2, CheckCircle } from 'lucide-react';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };

const makeEmptyForm = (tieneInventario) => ({
  tipo: tieneInventario ? 'venta' : 'ingreso',
  id_producto: '', cantidad: '', precio_unit: '', monto: '', descripcion: '',
});

const TIPO_COLOR = { venta: '#22c55e', compra: '#ef4444', ingreso: '#3b82f6', egreso: '#f59e0b' };
const TIPO_ES_ENTRADA = t => t === 'venta' || t === 'ingreso';

export default function CajaPage() {
  const { isAdmin, hasModulo } = useAuth();
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({ total_ingresos: 0, total_egresos: 0, saldo: 0 });
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(() => makeEmptyForm(hasModulo('inventario')));
  const [error, setError] = useState('');

  const tieneInventario = hasModulo('inventario');

  async function cargar() {
    if (!empresaId) return;
    const requests = [
      api.get(`/caja${empresaParam}`),
      api.get(`/caja/resumen${empresaParam}`),
    ];
    if (tieneInventario) requests.push(api.get(`/productos${empresaParam}`));

    const [mov, res, prods] = await Promise.all(requests);
    setMovimientos(mov.data);
    setResumen(res.data);
    if (prods) setProductos(prods.data);
  }

  useEffect(() => { cargar(); }, [empresaId]);

  // Cuando cambia el producto, precarga el precio del inventario
  function handleProductoChange(e) {
    const id = e.target.value;
    const prod = productos.find(p => String(p.id) === String(id));
    setForm(f => ({
      ...f,
      id_producto: id,
      precio_unit: prod ? prod.precio : '',
    }));
  }

  // Determina si el tipo actual usa producto (venta/compra) o es genérico (ingreso/egreso)
  const usaProducto = form.tipo === 'venta' || form.tipo === 'compra';

  // Monto calculado automáticamente cuando hay producto
  const montoCalculado = usaProducto && form.cantidad && form.precio_unit
    ? (Number(form.cantidad) * Number(form.precio_unit)).toFixed(2)
    : null;

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
        ? { tipo: form.tipo, id_producto: form.id_producto, cantidad: form.cantidad, precio_unit: form.precio_unit, descripcion: form.descripcion }
        : { tipo: form.tipo, monto: form.monto, descripcion: form.descripcion };
      await api.post(`/caja${empresaParam}`, payload);
      setForm(makeEmptyForm(tieneInventario));
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  // Producto seleccionado actualmente para mostrar su stock
  const prodSeleccionado = productos.find(p => String(p.id) === String(form.id_producto));

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>Caja / Libro Diario</h2>
        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {/* Resumen */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[['Ingresos (ventas)', resumen.total_ingresos, '#22c55e'], ['Egresos (compras)', resumen.total_egresos, '#ef4444'], ['Saldo', resumen.saldo, '#1e293b']].map(([label, val, color]) => (
            <div key={label} style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: `2px solid ${color}`, minWidth: '170px' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{label}</div>
              <div style={{ color, fontWeight: 'bold', fontSize: '1.25rem' }}>${Number(val || 0).toLocaleString('es-AR')}</div>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Registrar movimiento</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* Tipo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Tipo *</label>
              <select
                value={form.tipo}
                onChange={e => setForm({ ...makeEmptyForm(tieneInventario), tipo: e.target.value })}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                {tieneInventario && <option value="venta">Venta (ingreso + descuenta stock)</option>}
                {tieneInventario && <option value="compra">Compra (egreso + suma stock)</option>}
                <option value="ingreso">Ingreso genérico</option>
                <option value="egreso">Egreso genérico</option>
              </select>
            </div>

            {/* Producto + Cantidad + Precio (solo para venta/compra) */}
            {usaProducto && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Producto *</label>
                  <select
                    required
                    value={form.id_producto}
                    onChange={handleProductoChange}
                    style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', minWidth: '180px' }}
                  >
                    <option value="">— Seleccionar —</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre} — Stock: {Number(p.stock).toFixed(2)} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Cantidad (kg) *
                    {prodSeleccionado && form.tipo === 'venta' && (
                      <span style={{ color: Number(prodSeleccionado.stock) < Number(form.cantidad || 0) ? '#ef4444' : '#22c55e', marginLeft: '0.4rem' }}>
                        Stock: {Number(prodSeleccionado.stock).toFixed(2)} kg
                      </span>
                    )}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    value={form.cantidad}
                    onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                    style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Precio x kg *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.precio_unit}
                    onChange={e => setForm(f => ({ ...f, precio_unit: e.target.value }))}
                    style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '110px' }}
                  />
                </div>

                {/* Monto calculado (solo lectura) */}
                {montoCalculado && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Total</label>
                    <div style={{ padding: '0.4rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: '600', color: TIPO_COLOR[form.tipo] }}>
                      ${Number(montoCalculado).toLocaleString('es-AR')}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Monto manual (solo para ingreso/egreso genérico) */}
            {!usaProducto && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Monto *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '120px' }}
                />
              </div>
            )}

            {/* Descripción */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '0.75rem', color: '#64748b' }}>Descripción</label>
              <input
                placeholder="Opcional"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              />
            </div>

            <button
              type="submit"
              title="Registrar el movimiento en caja"
              style={{ padding: '0.45rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={16} /> Registrar
            </button>
            {error && <span style={{ color: '#ef4444', alignSelf: 'center' }}>{error}</span>}
          </form>
        </div>

        {/* Tabla de movimientos */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Producto</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Cant. (kg)</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Precio x kg</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
              <th style={thStyle}>Descripción</th>
              <th style={thStyle}>Usuario</th>
              {isAdmin && <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {movimientos.map(m => (
              <tr key={m.id}>
                <td style={tdStyle}>{new Date(m.fecha).toLocaleString('es-AR')}</td>
                <td style={{ ...tdStyle, color: TIPO_COLOR[m.tipo] || '#64748b', fontWeight: '600', textTransform: 'capitalize' }}>{m.tipo}</td>
                <td style={tdStyle}>{m.producto_nombre ? `${m.producto_codigo ? `[${m.producto_codigo}] ` : ''}${m.producto_nombre}` : '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{m.cantidad != null ? Number(m.cantidad).toFixed(2) : '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{m.precio_unit != null ? `$${Number(m.precio_unit).toLocaleString('es-AR')}` : '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', color: TIPO_ES_ENTRADA(m.tipo) ? '#22c55e' : '#ef4444' }}>
                  {TIPO_ES_ENTRADA(m.tipo) ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
                </td>
                <td style={tdStyle}>{m.descripcion || '-'}</td>
                <td style={tdStyle}>{m.usuario_nombre}</td>
                {isAdmin && (
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => eliminarMovimiento(m.id)}
                      title="Eliminar movimiento (revierte el stock si aplica)"
                      style={{ padding: '0.2rem 0.5rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 8} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>Sin movimientos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
