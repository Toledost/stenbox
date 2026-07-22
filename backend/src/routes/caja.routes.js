const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireModulo } = require('../middlewares/auth.middleware');
const c = require('../controllers/caja.controller');

router.use(verifyToken, requireModulo('caja'));
router.get('/', c.listarMovimientos);
router.get('/resumen', c.resumenCaja);
router.post('/', c.crearMovimiento);
router.delete('/:id', requireRole(1, 2), c.eliminarMovimiento);

module.exports = router;
