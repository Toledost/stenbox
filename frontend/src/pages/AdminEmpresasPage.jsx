import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState([]);
  const [form, setForm] = useState({ nombre: '', estado: 'prueba' });
  const [userForm, setUserForm] = useState({ nombre: '', apellido: '', email: '', password: '', id_rol: 2 });
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [error, setError] = useState('');

  async function cargar() {
    const { data } = await api.get('/empresas');
    setEmpresas(data);
  }

  useEffect(() => { cargar(); }, []);

  async function crearEmpresa(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/empresas', form);
      setForm({ nombre: '', estado: 'prueba' });
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  async function eliminarEmpresa(id) {
    if (!confirm('¿Eliminar empresa y todos sus datos?')) return;
    await api.delete(`/empresas/${id}`);
    cargar();
  }

  async function crearUsuario(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/empresas/${selectedEmpresa}/usuarios`, userForm);
      setUserForm({ nombre: '', apellido: '', email: '', password: '', id_rol: 2 });
      setSelectedEmpresa(null);
      alert('Usuario creado exitosamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem' }}>
        <h2>Administración de Empresas</h2>
        <form onSubmit={crearEmpresa} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input placeholder="Nombre empresa *" required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
          <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
            <option value="prueba">Prueba</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <button type="submit" style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Crear Empresa</button>
          {error && <span style={{ color: 'red' }}>{error}</span>}
        </form>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['ID', 'Nombre', 'Estado', 'Creada', 'Acciones'].map(h => <th key={h} style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.id}>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{emp.id}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{emp.nombre}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{emp.estado}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>{new Date(emp.created_at).toLocaleDateString('es-GT')}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => setSelectedEmpresa(emp.id)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>+ Usuario</button>
                  <button onClick={() => eliminarEmpresa(emp.id)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedEmpresa && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 1rem' }}>Crear Usuario — Empresa #{selectedEmpresa}</h3>
            <form onSubmit={crearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input placeholder="Nombre *" required value={userForm.nombre} onChange={e => setUserForm(p => ({ ...p, nombre: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <input placeholder="Apellido *" required value={userForm.apellido} onChange={e => setUserForm(p => ({ ...p, apellido: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <input placeholder="Email *" type="email" required value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <input placeholder="Contraseña *" type="password" required value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <select value={userForm.id_rol} onChange={e => setUserForm(p => ({ ...p, id_rol: Number(e.target.value) }))} style={{ padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <option value={2}>Admin</option>
                <option value={3}>Cajero</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" style={{ padding: '0.4rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Crear Usuario</button>
                <button type="button" onClick={() => setSelectedEmpresa(null)} style={{ padding: '0.4rem 1rem', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              </div>
              {error && <span style={{ color: 'red' }}>{error}</span>}
            </form>
          </div>
        )}
      </div>
    </>
  );
}
