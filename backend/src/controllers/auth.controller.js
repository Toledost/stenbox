const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email y contraseña requeridos' });

  try {
    const [rows] = await pool.query(
      'SELECT u.*, r.nombre as rol_nombre FROM usuario u JOIN rol r ON u.id_rol = r.id WHERE u.email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, id_empresa: user.id_empresa, id_rol: user.id_rol, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol_nombre, id_empresa: user.id_empresa }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = { login };
