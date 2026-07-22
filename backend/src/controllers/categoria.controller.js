const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

async function listar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [rows] = await pool.query(
    'SELECT * FROM categoria WHERE id_empresa = ? ORDER BY nombre',
    [id_empresa]
  );
  res.json(rows);
}

async function crear(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  try {
    const [result] = await pool.query(
      'INSERT INTO categoria (id_empresa, nombre) VALUES (?, ?)',
      [id_empresa, nombre.trim()]
    );
    res.status(201).json({ id: result.insertId, id_empresa, nombre: nombre.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
    throw err;
  }
}

async function actualizar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ message: 'Nombre requerido' });
  try {
    const [result] = await pool.query(
      'UPDATE categoria SET nombre = ? WHERE id = ? AND id_empresa = ?',
      [nombre.trim(), req.params.id, id_empresa]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json({ id: Number(req.params.id), nombre: nombre.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
    throw err;
  }
}

async function eliminar(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });

  // Verificar si tiene productos asociados
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM producto WHERE id_categoria = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (count > 0) return res.status(409).json({ message: `No se puede eliminar: tiene ${count} producto(s) asociado(s)` });

  const [result] = await pool.query(
    'DELETE FROM categoria WHERE id = ? AND id_empresa = ?',
    [req.params.id, id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Categoría no encontrada' });
  res.json({ ok: true });
}

module.exports = { listar, crear, actualizar, eliminar };
