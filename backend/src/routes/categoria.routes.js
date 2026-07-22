const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/categoria.controller');

router.use(verifyToken);
router.get('/', c.listar);
router.post('/', requireRole(1, 2), c.crear);
router.put('/:id', requireRole(1, 2), c.actualizar);
router.delete('/:id', requireRole(1, 2), c.eliminar);

module.exports = router;
