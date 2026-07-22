const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireModulo } = require('../middlewares/auth.middleware');
const c = require('../controllers/campo.controller');

router.use(verifyToken, requireModulo('inventario'));

// Configuración de campos (solo admin/superadmin)
router.get('/', c.listarCampos);
router.post('/', requireRole(1, 2), c.crearCampo);
router.put('/:id', requireRole(1, 2), c.actualizarCampo);
router.delete('/:id', requireRole(1, 2), c.eliminarCampo);

// Atributos por producto (lectura libre, escritura solo admin)
router.get('/atributos/:id_producto', c.listarAtributos);
router.put('/atributos/:id_producto', requireRole(1, 2), c.guardarAtributos);

module.exports = router;
