const pool = require('../config/db');

async function listarProductos(req, res) {
  const { id_empresa } = req.user;
  const [rows] = await pool.query('SELECT * FROM producto WHERE id_empresa=? ORDER BY nombre', [id_empresa]);
  res.json(rows);
}

async function crearProducto(req, res) {
  const { id_empresa } = req.user;
  const { codigo, nombre, precio, stock } = req.body;
  if (!nombre || precio == null) return res.status(400).json({ message: 'Nombre y precio requeridos' });
  const [result] = await pool.query(
    'INSERT INTO producto (id_empresa, codigo, nombre, precio, stock) VALUES (?, ?, ?, ?, ?)',
    [id_empresa, codigo || null, nombre, precio, stock || 0]
  );
  res.status(201).json({ id: result.insertId, id_empresa, codigo, nombre, precio, stock: stock || 0 });
}

async function actualizarProducto(req, res) {
  const { id_empresa } = req.user;
  const { id } = req.params;
  const { codigo, nombre, precio, stock } = req.body;
  await pool.query(
    'UPDATE producto SET codigo=?, nombre=?, precio=?, stock=? WHERE id=? AND id_empresa=?',
    [codigo, nombre, precio, stock, id, id_empresa]
  );
  res.json({ message: 'Producto actualizado' });
}

async function eliminarProducto(req, res) {
  const { id_empresa } = req.user;
  const { id } = req.params;
  await pool.query('DELETE FROM producto WHERE id=? AND id_empresa=?', [id, id_empresa]);
  res.json({ message: 'Producto eliminado' });
}

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto };
