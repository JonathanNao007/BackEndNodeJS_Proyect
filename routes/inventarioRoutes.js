const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getProductos,
    getProductoByClave,
    createProducto,
    updateProducto,
    deleteProducto,
    getExistencias,
    updateExistencia,
    getLotesByProducto,
    createLote,
    deleteLote,
    getResumenInventario
} = require('../controllers/inventarioController');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de resumen
router.get('/resumen', getResumenInventario);

// Rutas de productos
router.get('/productos', getProductos);
router.get('/productos/:claveProducto', getProductoByClave);
router.post('/productos', authorize('admin'), createProducto);
router.put('/productos/:idProducto', authorize('admin'), updateProducto);
router.delete('/productos/:idProducto', authorize('admin'), deleteProducto);

// Rutas de existencias
router.get('/existencias', getExistencias);
router.put('/existencias/:id', authorize('admin'), updateExistencia);

// Rutas de lotes
router.get('/lotes/:claveProducto', getLotesByProducto);
router.post('/lotes', authorize('admin'), createLote);
router.delete('/lotes/:idLote', authorize('admin'), deleteLote);

module.exports = router;