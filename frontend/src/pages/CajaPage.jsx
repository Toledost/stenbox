import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function CajaPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({ total_ingresos: 0, total_egresos: 0, saldo: 0 });
  const [form, setForm] = useState({ tipo: 'ingreso', monto: '', descripcion: '' });
  const [error, setError] = useState('');

  async function cargar() {
    const [mov, res] = await Promise.all([api.get('/caja'), api.get('/caja/resumen')]);
    setMovimientos(mov.data);
    setResumen(res.data);
  }

  useEffect(() => { cargar(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/caja', form);
      setForm({ tipo: 'ingreso', monto: '', descripcion: '' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem' }}>
        <h2>Caja / Libro Diario</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {[['Ingresos', resumen.total_ingresos, '#22c55e'], ['Egresos', resumen.total_egresos, '#ef4444'], ['Saldo', resumen.saldo, '#1e293b']].map(([label, val, color]) => (
            <div key={label} style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: `2px solid ${color}`, minWidth: '150px' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</div>
              <div style={{ color, fontWeight: 'bold', fontSize: '1.25rem' }}>${Number(val || 0).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
          <input placeholder="Monto *" type="number" step="0.01" required value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '120px' }} />
          <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: 1, minWidth: '200px' }} />
          <button type="submit" style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Registrar</button>
          {error && <span style={{ color: 'red' }}>{error}</span>}
        </form>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Fecha', 'Tipo', 'Monto', 'Descripción', 'Usuario'].map(h => <th key={h} style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {movimientos.map(m => (
              <tr key={m.id}>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{new Date(m.fecha).toLocaleString('es-GT')}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', color: m.tipo === 'ingreso' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{m.tipo}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>${Number(m.monto).toFixed(2)}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{m.descripcion || '-'}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{m.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
