const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getMovimientos,
    getMovimientoById,
    createMovimiento,
    getResumenMovimientos
} = require('../controllers/movimientosController');

// Todas las rutas requieren autenticación
router.use(protect);

router.get('/', getMovimientos);
router.get('/resumen', getResumenMovimientos);
router.get('/:id', getMovimientoById);
router.post('/', authorize('admin'), createMovimiento);

module.exports = router;