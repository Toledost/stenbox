const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function listarEmpresas(req, res) {
  const [rows] = await pool.query('SELECT * FROM empresa ORDER BY created_at DESC');
  res.json(rows);
}

async function crearEmpresa(req, res) {
  const { nombre, estado } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre requerido' });
  const [result] = await pool.query('INSERT INTO empresa (nombre, estado) VALUES (?, ?)', [nombre, estado || 'prueba']);
  res.status(201).json({ id: result.insertId, nombre, estado: estado || 'prueba' });
}

async function actualizarEmpresa(req, res) {
  const { id } = req.params;
  const { nombre, estado } = req.body;
  await pool.query('UPDATE empresa SET nombre=?, estado=? WHERE id=?', [nombre, estado, id]);
  res.json({ message: 'Empresa actualizada' });
}

async function eliminarEmpresa(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM empresa WHERE id=?', [id]);
  res.json({ message: 'Empresa eliminada' });
}

async function listarUsuariosDeEmpresa(req, res) {
  const { id_empresa } = req.params;
  const [usuarios] = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.username, u.id_rol, r.nombre AS rol_nombre
     FROM usuario u
     JOIN rol r ON u.id_rol = r.id
     WHERE u.id_empresa = ?
     ORDER BY u.nombre`,
    [id_empresa]
  );

  // Cargar módulos de cada usuario
  const [modulos] = await pool.query(
    `SELECT um.id_usuario, m.id, m.nombre, m.label
     FROM usuario_modulo um
     JOIN modulo m ON um.id_modulo = m.id
     WHERE um.id_usuario IN (?)`,
    [usuarios.length ? usuarios.map(u => u.id) : [0]]
  );

  const modulosPorUsuario = {};
  for (const m of modulos) {
    if (!modulosPorUsuario[m.id_usuario]) modulosPorUsuario[m.id_usuario] = [];
    modulosPorUsuario[m.id_usuario].push({ id: m.id, nombre: m.nombre, label: m.label });
  }

  res.json(usuarios.map(u => ({ ...u, modulos: modulosPorUsuario[u.id] || [] })));
}

async function crearUsuarioEnEmpresa(req, res) {
  const { id_empresa } = req.params;
  const { nombre, apellido, email, username, password, id_rol, modulos } = req.body;
  if (!nombre || !apellido || !email || !username || !password || !id_rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO usuario (id_empresa, id_rol, nombre, apellido, email, username, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_empresa, id_rol, nombre, apellido, email, username, hashed]
    );
    const id_usuario = result.insertId;

    // Asignar módulos (si no se envían, asignar todos por defecto)
    let moduloIds = modulos;
    if (!moduloIds || !moduloIds.length) {
      const [todos] = await conn.query('SELECT id FROM modulo');
      moduloIds = todos.map(m => m.id);
    }
    for (const id_modulo of moduloIds) {
      await conn.query('INSERT IGNORE INTO usuario_modulo (id_usuario, id_modulo) VALUES (?, ?)', [id_usuario, id_modulo]);
    }

    await conn.commit();
    res.status(201).json({ id: id_usuario, username, email });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El email o username ya está en uso' });
    }
    console.error(err);
    res.status(500).json({ message: 'Error al crear usuario' });
  } finally {
    conn.release();
  }
}

async function actualizarUsuario(req, res) {
  const { id_usuario } = req.params;
  const { id_rol, modulos } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (id_rol) {
      await conn.query('UPDATE usuario SET id_rol=? WHERE id=?', [id_rol, id_usuario]);
    }

    if (modulos !== undefined) {
      await conn.query('DELETE FROM usuario_modulo WHERE id_usuario=?', [id_usuario]);
      for (const id_modulo of modulos) {
        await conn.query('INSERT INTO usuario_modulo (id_usuario, id_modulo) VALUES (?, ?)', [id_usuario, id_modulo]);
      }
    }

    await conn.commit();
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  } finally {
    conn.release();
  }
}

async function eliminarUsuario(req, res) {
  const { id_usuario } = req.params;
  await pool.query('DELETE FROM usuario WHERE id=?', [id_usuario]);
  res.json({ message: 'Usuario eliminado' });
}

// GET /empresas/config — devuelve config de la propia empresa (admin/superadmin)
async function obtenerConfig(req, res) {
  const id_empresa = req.user.id_rol === 1 && req.query.empresa
    ? req.query.empresa
    : req.user.id_empresa;
  if (!id_empresa) return res.status(400).json({ message: 'Empresa no determinada' });
  const [[row]] = await pool.query('SELECT unidad_stock FROM empresa WHERE id=?', [id_empresa]);
  if (!row) return res.status(404).json({ message: 'Empresa no encontrada' });
  res.json(row);
}

// PUT /empresas/config — actualiza config de la propia empresa (admin/superadmin)
async function actualizarConfig(req, res) {
  const id_empresa = req.user.id_rol === 1 && req.query.empresa
    ? req.query.empresa
    : req.user.id_empresa;
  if (!id_empresa) return res.status(400).json({ message: 'Empresa no determinada' });
  const { unidad_stock } = req.body;
  if (!unidad_stock) return res.status(400).json({ message: 'unidad_stock requerido' });
  await pool.query('UPDATE empresa SET unidad_stock=? WHERE id=?', [unidad_stock.trim(), id_empresa]);
  res.json({ message: 'Configuración actualizada' });
}

module.exports = {
  listarEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  listarUsuariosDeEmpresa, crearUsuarioEnEmpresa, actualizarUsuario, eliminarUsuario,
  obtenerConfig, actualizarConfig,
};
