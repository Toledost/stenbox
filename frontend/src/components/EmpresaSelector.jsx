import { Building2 } from 'lucide-react';

export default function EmpresaSelector({ empresas, empresaId, onChange }) {
  if (!empresas || empresas.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.6rem 1rem', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <Building2 size={16} style={{ color: '#64748b', flexShrink: 0 }} />
      <span style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>Viendo empresa:</span>
      <select
        value={empresaId || ''}
        onChange={e => onChange(Number(e.target.value))}
        style={{ padding: '0.3rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: 'white', flex: 1, maxWidth: '280px' }}
      >
        {empresas.map(e => (
          <option key={e.id} value={e.id}>{e.nombre}</option>
        ))}
      </select>
    </div>
  );
}
