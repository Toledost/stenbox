const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/empresa.controller');

// Solo superadmin (id_rol=1)
router.use(verifyToken, requireRole(1));
router.get('/', c.listarEmpresas);
router.post('/', c.crearEmpresa);
router.put('/:id', c.actualizarEmpresa);
router.delete('/:id', c.eliminarEmpresa);
router.get('/:id_empresa/usuarios', c.listarUsuariosDeEmpresa);
router.post('/:id_empresa/usuarios', c.crearUsuarioEnEmpresa);
router.put('/usuarios/:id_usuario', c.actualizarUsuario);
router.delete('/usuarios/:id_usuario', c.eliminarUsuario);

module.exports = router;
