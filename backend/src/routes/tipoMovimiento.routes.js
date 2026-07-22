const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireModulo } = require('../middlewares/auth.middleware');
const c = require('../controllers/tipoMovimiento.controller');

router.use(verifyToken, requireModulo('caja'));
router.get('/', c.listarTipos);
router.post('/', requireRole(1, 2), c.crearTipo);
router.put('/:id', requireRole(1, 2), c.actualizarTipo);
router.delete('/:id', requireRole(1, 2), c.eliminarTipo);

module.exports = router;
