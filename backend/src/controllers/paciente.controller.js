const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { q } = req.query;
  let sql = 'SELECT * FROM paciente WHERE id_empresa = ?';
  const params = [id_empresa];
  if (q?.trim()) {
    sql += ' AND (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? OR telefono LIKE ?)';
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY apellido, nombre';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

async function obtener(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [[row]] = await pool.query('SELECT * FROM paciente WHERE id = ? AND id_empresa = ?', [req.params.id, id_empresa]);
  if (!row) return res.status(404).json({ message: 'Paciente no encontrado' });
  res.json(row);
}

async function crear(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre, apellido, dni, telefono, email, fecha_nacimiento, notas } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  if (!apellido?.trim()) return res.status(400).json({ message: 'Apellido requerido' });
  const [result] = await pool.query(
    'INSERT INTO paciente (id_empresa, nombre, apellido, dni, telefono, email, fecha_nacimiento, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id_empresa, nombre.trim(), apellido.trim(), dni?.trim() || null, telefono?.trim() || null, email?.trim() || null, fecha_nacimiento || null, notas?.trim() || null]
  );
  res.status(201).json({ id: result.insertId, id_empresa, nombre: nombre.trim(), apellido: apellido.trim(), dni: dni?.trim() || null, telefono: telefono?.trim() || null, email: email?.trim() || null, fecha_nacimiento: fecha_nacimiento || null });
}

async function actualizar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre, apellido, dni, telefono, email, fecha_nacimiento, notas } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  if (!apellido?.trim()) return res.status(400).json({ message: 'Apellido requerido' });
  const [result] = await pool.query(
    'UPDATE paciente SET nombre = ?, apellido = ?, dni = ?, telefono = ?, email = ?, fecha_nacimiento = ?, notas = ? WHERE id = ? AND id_empresa = ?',
    [nombre.trim(), apellido.trim(), dni?.trim() || null, telefono?.trim() || null, email?.trim() || null, fecha_nacimiento || null, notas?.trim() || null, req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Paciente no encontrado' });
  res.json({ id: Number(req.params.id), nombre: nombre.trim(), apellido: apellido.trim() });
}

async function eliminar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM turno WHERE id_paciente = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (count > 0) return res.status(409).json({ message: `No se puede eliminar: tiene ${count} turno(s) registrado(s)` });
  const [result] = await pool.query('DELETE FROM paciente WHERE id = ? AND id_empresa = ?', [req.params.id, id_empresa]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Paciente no encontrado' });
  res.json({ ok: true });
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
