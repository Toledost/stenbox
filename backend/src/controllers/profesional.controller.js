const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const soloActivos = req.query.activos === '1';
  const sql = soloActivos
    ? 'SELECT * FROM profesional WHERE id_empresa = ? AND activo = 1 ORDER BY nombre'
    : 'SELECT * FROM profesional WHERE id_empresa = ? ORDER BY nombre';
  const [rows] = await pool.query(sql, [id_empresa]);
  res.json(rows);
}

async function crear(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre, especialidad } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  const [result] = await pool.query(
    'INSERT INTO profesional (id_empresa, nombre, especialidad) VALUES (?, ?, ?)',
    [id_empresa, nombre.trim(), especialidad?.trim() || null]
  );
  res.status(201).json({ id: result.insertId, id_empresa, nombre: nombre.trim(), especialidad: especialidad?.trim() || null, activo: 1 });
}

async function actualizar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre, especialidad, activo } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  const [result] = await pool.query(
    'UPDATE profesional SET nombre = ?, especialidad = ?, activo = ? WHERE id = ? AND id_empresa = ?',
    [nombre.trim(), especialidad?.trim() || null, activo ?? 1, req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Profesional no encontrado' });
  res.json({ id: Number(req.params.id), nombre: nombre.trim(), especialidad: especialidad?.trim() || null, activo: activo ?? 1 });
}

async function eliminar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM turno WHERE id_profesional = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (count > 0) return res.status(409).json({ message: `No se puede eliminar: tiene ${count} turno(s) asociado(s)` });
  const [result] = await pool.query(
    'DELETE FROM profesional WHERE id = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Profesional no encontrado' });
  res.json({ ok: true });
}

module.exports = { listar, crear, actualizar, eliminar };
