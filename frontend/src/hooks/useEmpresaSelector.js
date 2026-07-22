import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export function useEmpresaSelector() {
  const { user, isSuperAdmin } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(user?.id_empresa || null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get('/empresas').then(({ data }) => {
      setEmpresas(data);
      if (!empresaId && data.length > 0) setEmpresaId(data[0].id);
    });
  }, [isSuperAdmin]);

  // Para usuarios normales: sin query param (el backend usa el JWT)
  // Para superadmin: siempre manda ?empresa=ID para poder cambiar
  const empresaParam = isSuperAdmin ? `?empresa=${empresaId}` : '';

  return { empresaId, setEmpresaId, empresas, empresaParam, isSuperAdmin };
}
