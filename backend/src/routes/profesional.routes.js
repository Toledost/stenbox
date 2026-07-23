const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireModulo } = require('../middlewares/auth.middleware');
const c = require('../controllers/profesional.controller');

router.use(verifyToken, requireModulo('turnero'));
router.get('/', c.listar);
router.post('/', requireRole(1, 2), c.crear);
router.put('/:id', requireRole(1, 2), c.actualizar);
router.delete('/:id', requireRole(1, 2), c.eliminar);

module.exports = router;
