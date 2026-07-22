import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function InventarioPage() {
  const { isAdmin } = useAuth();
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ codigo: '', nombre: '', precio: '', stock: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    const { data } = await api.get('/productos');
    setProductos(data);
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/productos/${editId}`, form);
        setEditId(null);
      } else {
        await api.post('/productos', form);
      }
      setForm({ codigo: '', nombre: '', precio: '', stock: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar producto?')) return;
    await api.delete(`/productos/${id}`);
    cargar();
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem' }}>
        <h2>Inventario</h2>
        {isAdmin && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input placeholder="Código" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            <input placeholder="Nombre *" required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            <input placeholder="Precio *" type="number" step="0.01" required value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100px' }} />
            <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '80px' }} />
            <button type="submit" style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{editId ? 'Actualizar' : 'Agregar'}</button>
            {editId && <button type="button" onClick={() => { setEditId(null); setForm({ codigo: '', nombre: '', precio: '', stock: '' }); }} style={{ padding: '0.4rem 1rem', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>}
            {error && <span style={{ color: 'red' }}>{error}</span>}
          </form>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Código', 'Nombre', 'Precio', 'Stock', isAdmin ? 'Acciones' : ''].map(h => <th key={h} style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{p.codigo || '-'}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{p.nombre}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>${Number(p.precio).toFixed(2)}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{p.stock}</td>
                {isAdmin && (
                  <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => { setEditId(p.id); setForm({ codigo: p.codigo || '', nombre: p.nombre, precio: p.precio, stock: p.stock }); }} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => eliminar(p.id)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
