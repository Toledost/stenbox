const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/empresa.controller');

router.use(verifyToken);

// Config de empresa: accesible por admin y superadmin
router.get('/config', requireRole(1, 2), c.obtenerConfig);
router.put('/config', requireRole(1, 2), c.actualizarConfig);

// Solo superadmin
router.get('/', requireRole(1), c.listarEmpresas);
router.post('/', requireRole(1), c.crearEmpresa);
router.put('/:id', requireRole(1), c.actualizarEmpresa);
router.delete('/:id', requireRole(1), c.eliminarEmpresa);
router.get('/:id_empresa/usuarios', requireRole(1), c.listarUsuariosDeEmpresa);
router.post('/:id_empresa/usuarios', requireRole(1), c.crearUsuarioEnEmpresa);
router.put('/usuarios/:id_usuario', requireRole(1), c.actualizarUsuario);
router.delete('/usuarios/:id_usuario', requireRole(1), c.eliminarUsuario);

module.exports = router;
