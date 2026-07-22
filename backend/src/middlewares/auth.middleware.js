const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, id_empresa, id_rol, email }
    next();
  } catch {
    return res.status(403).json({ message: 'Token inválido' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.id_rol)) {
      return res.status(403).json({ message: 'Sin permisos para esta acción' });
    }
    next();
  };
}

function requireModulo(nombre) {
  return (req, res, next) => {
    // superadmin (id_rol=1) siempre tiene acceso
    if (req.user.id_rol === 1) return next();
    const modulos = req.user.modulos || [];
    if (!modulos.includes(nombre)) {
      return res.status(403).json({ message: `Sin acceso al módulo: ${nombre}` });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, requireModulo };
