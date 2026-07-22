const pool = require('../config/db');

async function listarMovimientos(req, res) {
  const { id_empresa } = req.user;
  const [rows] = await pool.query(
    `SELECT cm.*, CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
     FROM caja_movimiento cm
     JOIN usuario u ON cm.id_usuario = u.id
     WHERE cm.id_empresa = ?
     ORDER BY cm.fecha DESC`,
    [id_empresa]
  );
  res.json(rows);
}

async function crearMovimiento(req, res) {
  const { id_empresa, id } = req.user;
  const { tipo, monto, descripcion } = req.body;
  if (!tipo || !monto) return res.status(400).json({ message: 'Tipo y monto requeridos' });
  const [result] = await pool.query(
    'INSERT INTO caja_movimiento (id_empresa, id_usuario, tipo, monto, descripcion) VALUES (?, ?, ?, ?, ?)',
    [id_empresa, id, tipo, monto, descripcion || null]
  );
  res.status(201).json({ id: result.insertId, id_empresa, id_usuario: id, tipo, monto, descripcion });
}

async function resumenCaja(req, res) {
  const { id_empresa } = req.user;
  const [rows] = await pool.query(
    `SELECT
       SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END) as total_ingresos,
       SUM(CASE WHEN tipo='egreso' THEN monto ELSE 0 END) as total_egresos,
       SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END) as saldo
     FROM caja_movimiento WHERE id_empresa=?`,
    [id_empresa]
  );
  res.json(rows[0]);
}

module.exports = { listarMovimientos, crearMovimiento, resumenCaja };
