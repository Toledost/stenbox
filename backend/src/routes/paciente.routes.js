const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireModulo } = require('../middlewares/auth.middleware');
const c = require('../controllers/paciente.controller');

router.use(verifyToken, requireModulo('turnero'));
router.get('/', c.listar);
router.get('/:id', c.obtener);
router.post('/', c.crear);
router.put('/:id', c.actualizar);
router.delete('/:id', requireRole(1, 2), c.eliminar);

module.exports = router;
