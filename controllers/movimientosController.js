const { sequelize } = require('../database/db');
const Movimientos = require('../models/Movimientos');
const Movimientosdetalle = require('../models/Movimientosdetalle');
const Producto = require('../models/Productos');
const { Op } = require('sequelize');

// @desc    Obtener todos los movimientos
// @route   GET /api/movimientos
const getMovimientos = async (req, res) => {
    try {
        const { tipoMovimiento, fechaInicio, fechaFin, idSucursal, limit = 100 } = req.query;
        
        let where = {};
        
        if (tipoMovimiento) where.tipoMovimiento = tipoMovimiento;
        if (idSucursal) where.idSucursal = idSucursal;
        
        if (fechaInicio || fechaFin) {
            where.fecha = {};
            if (fechaInicio) where.fecha[Op.gte] = new Date(fechaInicio);
            if (fechaFin) where.fecha[Op.lte] = new Date(fechaFin);
        }
        
        const movimientos = await Movimientos.findAll({
            where,
            order: [['fecha', 'DESC']],
            limit: parseInt(limit),
            raw: true
        });
        
        res.json({
            success: true,
            data: movimientos,
            total: movimientos.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimientos',
            error: error.message
        });
    }
};

// @desc    Obtener movimiento por ID con sus detalles
// @route   GET /api/movimientos/:id
const getMovimientoById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener el movimiento
        const movimiento = await Movimientos.findByPk(id, { raw: true });
        
        if (!movimiento) {
            return res.status(404).json({
                success: false,
                message: 'Movimiento no encontrado'
            });
        }
        
        // Obtener los detalles del movimiento
        const detalles = await Movimientosdetalle.findAll({
            where: { idMovimiento: id },
            raw: true
        });
        
        // Enriquecer detalles con información del producto
        if (detalles.length > 0) {
            const clavesProducto = [...new Set(detalles.map(d => d.claveProducto))];
            const productos = await Producto.findAll({
                where: { 
                    claveProducto: { [Op.in]: clavesProducto },
                    delete: false
                },
                attributes: ['claveProducto', 'descripcion', 'sKU', 'unidad', 'precioP'],
                raw: true
            });
            
            const productosMap = new Map(productos.map(p => [p.claveProducto, p]));
            
            const detallesConProducto = detalles.map(detalle => ({
                ...detalle,
                producto: productosMap.get(detalle.claveProducto) || null,
                subtotal: (detalle.cantidad || 0) * (productosMap.get(detalle.claveProducto)?.precioP || 0)
            }));
            
            movimiento.detalles = detallesConProducto;
            movimiento.totalMovimiento = detallesConProducto.reduce((sum, d) => sum + (d.subtotal || 0), 0);
            movimiento.totalProductos = detallesConProducto.reduce((sum, d) => sum + (d.cantidad || 0), 0);
        } else {
            movimiento.detalles = [];
            movimiento.totalMovimiento = 0;
            movimiento.totalProductos = 0;
        }
        
        res.json({
            success: true,
            data: movimiento
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener movimiento',
            error: error.message
        });
    }
};

// @desc    Crear nuevo movimiento
// @route   POST /api/movimientos
const createMovimiento = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const {
            tipoMovimiento,
            idUsuario,
            idSucursal,
            referencia,
            idPedido,
            detalles
        } = req.body;
        
        // Crear el movimiento
        const movimiento = await Movimientos.create({
            tipoMovimiento,
            idUsuario,
            idSucursal,
            referencia,
            idPedido: idPedido || null,
            fecha: new Date(),
            enServer: true
        }, { transaction: t });
        
        // Crear los detalles del movimiento
        if (detalles && detalles.length > 0) {
            for (const detalle of detalles) {
                await Movimientosdetalle.create({
                    idMovimiento: movimiento.idmovimiento,
                    idProducto: detalle.idProducto,
                    claveProducto: detalle.claveProducto,
                    codigoBarras: detalle.codigoBarras,
                    cantidad: detalle.cantidad,
                    afectoInventario: detalle.afectoInventario || true,
                    stockRegister: detalle.stockRegister || 0
                }, { transaction: t });
            }
        }
        
        await t.commit();
        
        res.status(201).json({
            success: true,
            message: 'Movimiento creado exitosamente',
            data: movimiento
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear movimiento',
            error: error.message
        });
    }
};

// @desc    Obtener resumen de movimientos
// @route   GET /api/movimientos/resumen
const getResumenMovimientos = async (req, res) => {
    try {
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        // Movimientos del día
        const movimientosHoy = await Movimientos.count({
            where: {
                fecha: { [Op.gte]: new Date(hoy.setHours(0, 0, 0)) }
            }
        });
        
        // Movimientos de la semana
        const movimientosSemana = await Movimientos.count({
            where: {
                fecha: { [Op.gte]: inicioSemana }
            }
        });
        
        // Movimientos del mes
        const movimientosMes = await Movimientos.count({
            where: {
                fecha: { [Op.gte]: inicioMes }
            }
        });
        
        // Totales por tipo de movimiento
        const tiposMovimiento = await Movimientos.findAll({
            attributes: [
                'tipoMovimiento',
                [sequelize.fn('COUNT', sequelize.col('idmovimiento')), 'total']
            ],
            group: ['tipoMovimiento'],
            raw: true
        });
        
        res.json({
            success: true,
            data: {
                resumen: {
                    hoy: movimientosHoy,
                    semana: movimientosSemana,
                    mes: movimientosMes
                },
                porTipo: tiposMovimiento
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: error.message
        });
    }
};

module.exports = {
    getMovimientos,
    getMovimientoById,
    createMovimiento,
    getResumenMovimientos
};