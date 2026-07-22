const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const c = require('../controllers/producto.controller');

router.use(verifyToken);
router.get('/', c.listarProductos);
router.post('/', requireRole(1, 2), c.crearProducto);
router.put('/:id', requireRole(1, 2), c.actualizarProducto);
router.delete('/:id', requireRole(1, 2), c.eliminarProducto);

module.exports = router;
