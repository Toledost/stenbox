import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import { useEmpresaSelector } from '../hooks/useEmpresaSelector';
import EmpresaSelector from '../components/EmpresaSelector';

const tdStyle = { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0' };
const thStyle = { ...tdStyle, background: '#f8fafc', fontWeight: '600', textAlign: 'left' };

export default function CategoriaPage() {
  const { empresaParam, empresaId, empresas, setEmpresaId, isSuperAdmin } = useEmpresaSelector();
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [error, setError] = useState('');
  const [errorEdit, setErrorEdit] = useState('');

  async function cargar() {
    if (!empresaId) return;
    const { data } = await api.get(`/categorias${empresaParam}`);
    setCategorias(data);
  }

  useEffect(() => { cargar(); }, [empresaId]);

  async function handleAgregar(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/categorias${empresaParam}`, { nombre });
      setNombre('');
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  }

  function iniciarEdicion(cat) {
    setEditId(cat.id);
    setEditNombre(cat.nombre);
    setErrorEdit('');
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setErrorEdit('');
    try {
      await api.put(`/categorias/${editId}${empresaParam}`, { nombre: editNombre });
      setEditId(null);
      setEditNombre('');
      cargar();
    } catch (err) {
      setErrorEdit(err.response?.data?.message || 'Error');
    }
  }

  async function handleEliminar(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    try {
      await api.delete(`/categorias/${cat.id}${empresaParam}`);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>Categorías de producto</h2>
        {isSuperAdmin && <EmpresaSelector empresas={empresas} empresaId={empresaId} onChange={setEmpresaId} />}

        {/* Formulario agregar */}
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Nueva categoría</h3>
          <form onSubmit={handleAgregar} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              required
              placeholder="Ej: Vacuno"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              style={{ flex: 1, padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
            />
            <button
              type="submit"
              title="Agregar nueva categoría"
              style={{ padding: '0.45rem 1.25rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus size={15} /> Agregar
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{error}</p>}
        </div>

        {/* Tabla */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Nombre</th>
              <th style={{ ...thStyle, textAlign: 'center', width: '160px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(cat => (
              <tr key={cat.id}>
                <td style={tdStyle}>
                  {editId === cat.id ? (
                    <form onSubmit={handleGuardar} style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        required
                        autoFocus
                        value={editNombre}
                        onChange={e => setEditNombre(e.target.value)}
                        style={{ flex: 1, padding: '0.3rem 0.5rem', border: '1px solid #94a3b8', borderRadius: '4px' }}
                      />
                      <button type="submit" title="Guardar nombre de categoría" style={{ padding: '0.3rem 0.6rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Save size={13} /> Guardar</button>
                      <button type="button" onClick={() => setEditId(null)} title="Cancelar edición" style={{ padding: '0.3rem 0.6rem', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}><X size={13} /></button>
                      {errorEdit && <span style={{ color: '#ef4444', alignSelf: 'center', fontSize: '0.8rem' }}>{errorEdit}</span>}
                    </form>
                  ) : (
                    cat.nombre
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {editId !== cat.id && (
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button onClick={() => iniciarEdicion(cat)} title="Editar nombre de categoría" style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Pencil size={13} /> Editar</button>
                      <button onClick={() => handleEliminar(cat)} title="Eliminar categoría" style={{ padding: '0.25rem 0.6rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Trash2 size={13} /> Eliminar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td colSpan={2} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>Sin categorías creadas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
