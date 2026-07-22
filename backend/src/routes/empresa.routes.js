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
router.post('/:id_empresa/usuarios', c.crearUsuarioEnEmpresa);

module.exports = router;
