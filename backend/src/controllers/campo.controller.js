const pool = require('../config/db');

function resolverEmpresa(req) {
  if (req.user.id_rol === 1 && req.query.empresa) return req.query.empresa;
  if (req.user.id_empresa) return req.user.id_empresa;
  return req.query.empresa || null;
}

// GET /campos — lista campos de la empresa
async function listarCampos(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const [rows] = await pool.query(
    'SELECT * FROM campo_producto WHERE id_empresa = ? ORDER BY orden, id',
    [id_empresa]
  );
  res.json(rows);
}

// POST /campos
async function crearCampo(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { nombre, label, tipo, opciones, requerido, orden } = req.body;
  if (!nombre || !label) return res.status(400).json({ message: 'nombre y label son requeridos' });
  try {
    const [result] = await pool.query(
      'INSERT INTO campo_producto (id_empresa, nombre, label, tipo, opciones, requerido, orden) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_empresa, nombre, label, tipo || 'text', opciones ? JSON.stringify(opciones) : null, requerido ? 1 : 0, orden || 0]
    );
    res.status(201).json({ id: result.insertId, id_empresa, nombre, label, tipo: tipo || 'text', opciones, requerido: requerido ? 1 : 0, orden: orden || 0 });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ya existe un campo con ese nombre' });
    throw err;
  }
}

// PUT /campos/:id
async function actualizarCampo(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;
  const { label, tipo, opciones, requerido, orden } = req.body;
  await pool.query(
    'UPDATE campo_producto SET label=?, tipo=?, opciones=?, requerido=?, orden=? WHERE id=? AND id_empresa=?',
    [label, tipo, opciones ? JSON.stringify(opciones) : null, requerido ? 1 : 0, orden || 0, id, id_empresa]
  );
  res.json({ message: 'Campo actualizado' });
}

// DELETE /campos/:id
async function eliminarCampo(req, res) {
  const id_empresa = resolverEmpresa(req);
  if (!id_empresa) return res.status(400).json({ message: 'Indica ?empresa=ID' });
  const { id } = req.params;
  await pool.query('DELETE FROM campo_producto WHERE id=? AND id_empresa=?', [id, id_empresa]);
  res.json({ message: 'Campo eliminado' });
}

// GET /campos/atributos/:id_producto
async function listarAtributos(req, res) {
  const { id_producto } = req.params;
  const [rows] = await pool.query(
    'SELECT id_campo, valor FROM producto_atributo WHERE id_producto = ?',
    [id_producto]
  );
  res.json(rows);
}

// PUT /campos/atributos/:id_producto — guarda todos los atributos de un producto (upsert)
async function guardarAtributos(req, res) {
  const { id_producto } = req.params;
  const { atributos } = req.body; // [{ id_campo, valor }]
  if (!Array.isArray(atributos)) return res.status(400).json({ message: 'atributos debe ser un array' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM producto_atributo WHERE id_producto = ?', [id_producto]);
    for (const { id_campo, valor } of atributos) {
      if (valor !== '' && valor != null) {
        await conn.query(
          'INSERT INTO producto_atributo (id_producto, id_campo, valor) VALUES (?, ?, ?)',
          [id_producto, id_campo, valor]
        );
      }
    }
    await conn.commit();
    res.json({ message: 'Atributos guardados' });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { listarCampos, crearCampo, actualizarCampo, eliminarCampo, listarAtributos, guardarAtributos };
