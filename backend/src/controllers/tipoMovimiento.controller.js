const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listarTipos(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [rows] = await pool.query(
    'SELECT * FROM tipo_movimiento WHERE id_empresa=? ORDER BY orden, id',
    [id_empresa]
  );
  res.json(rows);
}

async function crearTipo(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre, label, es_entrada, afecta_stock, orden } = req.body;
  if (!nombre || !label) return res.status(400).json({ message: 'nombre y label requeridos' });
  try {
    const [result] = await pool.query(
      'INSERT INTO tipo_movimiento (id_empresa, nombre, label, es_entrada, afecta_stock, orden) VALUES (?,?,?,?,?,?)',
      [id_empresa, nombre.trim(), label.trim(), es_entrada ? 1 : 0, afecta_stock ? 1 : 0, orden || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe un tipo con ese nombre' });
    throw err;
  }
}

async function actualizarTipo(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;
  const { nombre, label, es_entrada, afecta_stock, activo, orden } = req.body;
  await pool.query(
    'UPDATE tipo_movimiento SET nombre=?, label=?, es_entrada=?, afecta_stock=?, activo=?, orden=? WHERE id=? AND id_empresa=?',
    [nombre.trim(), label.trim(), es_entrada ? 1 : 0, afecta_stock ? 1 : 0, activo ? 1 : 0, orden || 0, id, id_empresa]
  );
  res.json({ message: 'Tipo actualizado' });
}

async function eliminarTipo(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;
  await pool.query('DELETE FROM tipo_movimiento WHERE id=? AND id_empresa=?', [id, id_empresa]);
  res.json({ message: 'Tipo eliminado' });
}

module.exports = { listarTipos, crearTipo, actualizarTipo, eliminarTipo };
