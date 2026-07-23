const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id_profesional } = req.query;
  let sql = `SELECT ac.*, p.nombre AS profesional_nombre
             FROM agenda_config ac
             JOIN profesional p ON p.id = ac.id_profesional
             WHERE ac.id_empresa = ?`;
  const params = [id_empresa];
  if (id_profesional) {
    sql += ' AND ac.id_profesional = ?';
    params.push(id_profesional);
  }
  sql += ' ORDER BY ac.id_profesional, ac.dia_semana, ac.hora_inicio';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

async function crear(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id_profesional, dia_semana, hora_inicio, hora_fin, duracion_turno } = req.body;
  if (id_profesional == null || dia_semana == null || !hora_inicio || !hora_fin)
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  if (hora_inicio >= hora_fin)
    return res.status(400).json({ message: 'hora_inicio debe ser menor que hora_fin' });
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM profesional WHERE id = ? AND id_empresa = ?',
    [id_profesional, id_empresa]
  );
  if (!count) return res.status(404).json({ message: 'Profesional no encontrado' });
  const [result] = await pool.query(
    'INSERT INTO agenda_config (id_empresa, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_turno) VALUES (?, ?, ?, ?, ?, ?)',
    [id_empresa, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_turno || 30]
  );
  res.status(201).json({ id: result.insertId, id_empresa, id_profesional, dia_semana, hora_inicio, hora_fin, duracion_turno: duracion_turno || 30, activo: 1 });
}

async function actualizar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { hora_inicio, hora_fin, duracion_turno, activo } = req.body;
  if (!hora_inicio || !hora_fin) return res.status(400).json({ message: 'Faltan campos requeridos' });
  if (hora_inicio >= hora_fin) return res.status(400).json({ message: 'hora_inicio debe ser menor que hora_fin' });
  const [result] = await pool.query(
    'UPDATE agenda_config SET hora_inicio = ?, hora_fin = ?, duracion_turno = ?, activo = ? WHERE id = ? AND id_empresa = ?',
    [hora_inicio, hora_fin, duracion_turno || 30, activo ?? 1, req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Configuración no encontrada' });
  res.json({ ok: true });
}

async function eliminar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [result] = await pool.query(
    'DELETE FROM agenda_config WHERE id = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Configuración no encontrada' });
  res.json({ ok: true });
}

module.exports = { listar, crear, actualizar, eliminar };
