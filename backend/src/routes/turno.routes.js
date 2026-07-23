const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireModulo } = require('../middlewares/auth.middleware');
const c = require('../controllers/turno.controller');

router.use(verifyToken, requireModulo('turnero'));
router.get('/dia', c.listarPorFecha);
router.get('/semana', c.listarPorSemana);
router.post('/generar', requireRole(1, 2), c.generarTurnosDia);
router.post('/', requireRole(1, 2), c.crear);
router.put('/:id', c.actualizar);
router.delete('/:id', requireRole(1, 2), c.eliminar);

module.exports = router;
