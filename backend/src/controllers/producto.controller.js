const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listarProductos(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [rows] = await pool.query(
    `SELECT p.*, c.nombre AS categoria
     FROM producto p
     LEFT JOIN categoria c ON p.id_categoria = c.id
     WHERE p.id_empresa = ?
     ORDER BY c.nombre, p.nombre`,
    [id_empresa]
  );
  // Adjuntar atributos personalizados a cada producto
  if (rows.length > 0) {
    const ids = rows.map(r => r.id);
    const [attrs] = await pool.query(
      'SELECT id_producto, id_campo, valor FROM producto_atributo WHERE id_producto IN (?)',
      [ids]
    );
    const attrMap = {};
    for (const a of attrs) {
      if (!attrMap[a.id_producto]) attrMap[a.id_producto] = {};
      attrMap[a.id_producto][a.id_campo] = a.valor;
    }
    for (const p of rows) p.atributos = attrMap[p.id] || {};
  }
  res.json(rows);
}

async function crearProducto(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { codigo, nombre, id_categoria, precio, stock } = req.body;
  if (!nombre || precio == null) return res.status(400).json({ message: 'Nombre y precio requeridos' });
  const [result] = await pool.query(
    'INSERT INTO producto (id_empresa, codigo, nombre, id_categoria, precio, stock) VALUES (?, ?, ?, ?, ?, ?)',
    [id_empresa, codigo || null, nombre, id_categoria || null, precio, stock || 0]
  );
  res.status(201).json({ id: result.insertId, id_empresa, codigo, nombre, id_categoria, precio, stock: stock || 0 });
}

async function actualizarProducto(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;
  const { codigo, nombre, id_categoria, precio, stock } = req.body;
  await pool.query(
    'UPDATE producto SET codigo=?, nombre=?, id_categoria=?, precio=?, stock=? WHERE id=? AND id_empresa=?',
    [codigo || null, nombre, id_categoria || null, precio, stock, id, id_empresa]
  );
  res.json({ message: 'Producto actualizado' });
}

async function eliminarProducto(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;
  await pool.query('DELETE FROM producto WHERE id=? AND id_empresa=?', [id, id_empresa]);
  res.json({ message: 'Producto eliminado' });
}

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto };
