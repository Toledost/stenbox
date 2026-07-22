import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Stenbox</h2>
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <input type="text" placeholder="Usuario" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
        <input type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
        <button type="submit" style={{ padding: '0.75rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Entrar</button>
      </form>
    </div>
  );
}
