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

async function crearUsuarioEnEmpresa(req, res) {
  const { id_empresa } = req.params;
  const { nombre, apellido, email, password, id_rol } = req.body;
  if (!nombre || !apellido || !email || !password || !id_rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO usuario (id_empresa, id_rol, nombre, apellido, email, password) VALUES (?, ?, ?, ?, ?, ?)',
    [id_empresa, id_rol, nombre, apellido, email, hashed]
  );
  res.status(201).json({ id: result.insertId, email });
}

module.exports = { listarEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa, crearUsuarioEnEmpresa };
