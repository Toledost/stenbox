const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');
const c = require('../controllers/caja.controller');

router.use(verifyToken);
router.get('/', c.listarMovimientos);
router.get('/resumen', c.resumenCaja);
router.post('/', c.crearMovimiento);

module.exports = router;
