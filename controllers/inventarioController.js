const { sequelize } = require('../database/db');
const Producto = require('../models/Productos');
const ExistenciaSucursal = require('../models/ExistenciaSucursal');
const Lotes = require('../models/Lotes');
const { Op } = require('sequelize');

// @desc    Obtener todos los productos con su inventario
// @route   GET /api/inventario/productos
const getProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            where: { delete: false },
            order: [['descripcion', 'ASC']],
            raw: true  // Obtener datos planos
        });
        
        if (!productos.length) {
            return res.json({ success: true, data: [] });
        }
        
        const clavesProducto = productos.map(p => p.claveProducto);
        
        const existencias = await ExistenciaSucursal.findAll({
            where: { 
                claveProducto: { [Op.in]: clavesProducto }
            },
            raw: true
        });
        
        const lotes = await Lotes.findAll({
            where: { 
                claveProducto: { [Op.in]: clavesProducto },
                existencia: { [Op.gt]: 0 }
            },
            raw: true,
            order: [['caducidad', 'ASC']]
        });
        
        const existenciasMap = {};
        existencias.forEach(existencia => {
            if (!existenciasMap[existencia.claveProducto]) {
                existenciasMap[existencia.claveProducto] = [];
            }
            existenciasMap[existencia.claveProducto].push(existencia);
        });
        
        const lotesMap = {};
        lotes.forEach(lote => {
            if (!lotesMap[lote.claveProducto]) {
                lotesMap[lote.claveProducto] = [];
            }
            lotesMap[lote.claveProducto].push(lote);
        });
        
        const productosConInventario = productos.map(producto => ({
            ...producto,
            existencias: existenciasMap[producto.claveProducto] || [],
            lotes: lotesMap[producto.claveProducto] || []
        }));
        
        res.json({
            success: true,
            data: productosConInventario
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

// @desc    Obtener producto por claveProducto
// @route   GET /api/inventario/productos/:claveProducto
const getProductoByClave = async (req, res) => {
    try {
        const { claveProducto } = req.params;
        
        const producto = await Producto.findOne({
            where: { claveProducto, delete: false },
            include: [
                {
                    model: ExistenciaSucursal,
                    as: 'existencias'
                },
                {
                    model: Lotes,
                    as: 'lotes',
                    where: { existencia: { [Op.gt]: 0 } },
                    required: false
                }
            ]
        });
        
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: producto
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
};

// @desc    Crear nuevo producto
// @route   POST /api/inventario/productos
const createProducto = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const {
            descripcion,
            codigoBarras,
            claveProducto,
            sKU,
            skuFabricante,
            upcEan,
            unidad,
            precioP,
            costoP,
            idCategoria,
            idSucursal,
            idEmpresa,
            idUsuario,
            ...otrosCampos
        } = req.body;
        
        // Validar que no exista la clave
        const existeClave = await Producto.findOne({ where: { claveProducto } });
        if (existeClave) {
            return res.status(400).json({
                success: false,
                message: 'La clave de producto ya existe'
            });
        }
        
        // Validar que no exista el código de barras
        const existeCodigo = await Producto.findOne({ where: { codigoBarras } });
        if (existeCodigo) {
            return res.status(400).json({
                success: false,
                message: 'El código de barras ya existe'
            });
        }
        
        // Crear producto
        const producto = await Producto.create({
            descripcion,
            codigoBarras,
            claveProducto,
            sKU,
            skuFabricante,
            upcEan,
            unidad,
            precioP,
            costoP,
            idCategoria,
            idSucursal,
            idEmpresa,
            idUsuario,
            existencia: 0,
            modificacion: new Date(),
            creacion: new Date(),
            ...otrosCampos
        }, { transaction: t });
        
        // Crear existencia inicial en sucursal
        await ExistenciaSucursal.create({
            idSucursal,
            idProducto: producto.idProducto,
            claveProducto,
            codigoBarras,
            existencia: 0,
            porEntregar: 0
        }, { transaction: t });
        
        await t.commit();
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: producto
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
};

// @desc    Actualizar producto
// @route   PUT /api/inventario/productos/:idProducto
const updateProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;
        const updates = req.body;
        
        const producto = await Producto.findByPk(idProducto);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        updates.modificacion = new Date();
        await producto.update(updates);
        
        res.json({
            success: true,
            message: 'Producto actualizado',
            data: producto
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto'
        });
    }
};

// @desc    Eliminar producto (soft delete)
// @route   DELETE /api/inventario/productos/:idProducto
const deleteProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;
        
        const producto = await Producto.findByPk(idProducto);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        await producto.update({ delete: true });
        
        res.json({
            success: true,
            message: 'Producto eliminado'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto'
        });
    }
};

// @desc    Obtener existencias por sucursal
// @route   GET /api/inventario/existencias
const getExistencias = async (req, res) => {
    try {
        const { idSucursal } = req.query;
        
        let where = {};
        if (idSucursal) where.idSucursal = idSucursal;
        
        // 1. Obtener todas las existencias
        const existencias = await ExistenciaSucursal.findAll({
            where,
            raw: true
        });
        
        if (!existencias.length) {
            return res.json({ success: true, data: [] });
        }
        
        // 2. Extraer todas las claves de producto
        const clavesProducto = [...new Set(existencias.map(e => e.claveProducto))];
        
        // 3. Obtener los productos relacionados
        const productos = await Producto.findAll({
            where: { 
                claveProducto: { [Op.in]: clavesProducto },
                delete: false 
            },
            attributes: ['claveProducto', 'descripcion', 'sKU', 'precioP', 'unidad'],
            raw: true
        });
        
        // 4. Crear mapa de productos por claveProducto
        const productosMap = new Map();
        productos.forEach(p => {
            productosMap.set(p.claveProducto, p);
        });
        
        // 5. Combinar los datos
        const resultado = existencias.map(existencia => ({
            ...existencia,
            producto: productosMap.get(existencia.claveProducto) || null
        }));
        
        res.json({
            success: true,
            data: resultado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener existencias'
        });
    }
};

// @desc    Actualizar existencia
// @route   PUT /api/inventario/existencias/:id
const updateExistencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { existencia } = req.body;
        
        const existenciaRecord = await ExistenciaSucursal.findByPk(id);
        if (!existenciaRecord) {
            return res.status(404).json({
                success: false,
                message: 'Existencia no encontrada'
            });
        }
        
        await existenciaRecord.update({ existencia });
        
        // Actualizar también la existencia en Producto
        await Producto.update(
            { existencia },
            { where: { claveProducto: existenciaRecord.claveProducto } }
        );
        
        res.json({
            success: true,
            message: 'Existencia actualizada',
            data: existenciaRecord
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar existencia'
        });
    }
};

// @desc    Obtener lotes por producto
// @route   GET /api/inventario/lotes/:claveProducto
const getLotesByProducto = async (req, res) => {
    try {
        const { claveProducto } = req.params;
        
        const lotes = await Lotes.findAll({
            where: { 
                claveProducto,
                existencia: { [Op.gt]: 0 }
            },
            order: [['caducidad', 'ASC']]
        });
        
        // Agrupar por lote y calcular días restantes
        const lotesConInfo = lotes.map(lote => {
            const hoy = new Date();
            const caducidad = new Date(lote.caducidad);
            const diasRestantes = Math.ceil((caducidad - hoy) / (1000 * 60 * 60 * 24));
            
            let estado = 'good';
            if (diasRestantes <= 0) estado = 'vencido';
            else if (diasRestantes <= 30) estado = 'warning';
            else if (diasRestantes <= 90) estado = 'careful';
            
            return {
                ...lote.toJSON(),
                diasRestantes,
                estado
            };
        });
        
        res.json({
            success: true,
            data: lotesConInfo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener lotes'
        });
    }
};

// @desc    Crear lote
// @route   POST /api/inventario/lotes
const createLote = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const {
            idSucursal,
            claveProducto,
            lote,
            caducidad,
            existencia,
            recibidos,
            codigoBarras
        } = req.body;
        
        // Verificar que el producto existe
        const producto = await Producto.findOne({ 
            where: { claveProducto, delete: false }
        });
        
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        
        // Verificar si el lote ya existe
        const loteExistente = await Lotes.findOne({
            where: { 
                claveProducto,
                lote,
                idSucursal
            }
        });
        
        let nuevoLote;
        if (loteExistente) {
            // Actualizar existencia del lote existente
            const nuevaExistencia = loteExistente.existencia + existencia;
            await loteExistente.update({ 
                existencia: nuevaExistencia,
                recibidos: loteExistente.recibidos + (recibidos || existencia)
            }, { transaction: t });
            nuevoLote = loteExistente;
        } else {
            // Crear nuevo lote
            nuevoLote = await Lotes.create({
                idSucursal,
                claveProducto,
                lote,
                caducidad,
                existencia,
                recibidos: recibidos || existencia,
                codigoBarras,
                fechaRegistro: new Date()
            }, { transaction: t });
        }
        
        // Actualizar existencia en ExistenciaSucursal
        const existenciaSucursal = await ExistenciaSucursal.findOne({
            where: { claveProducto, idSucursal }
        });
        
        if (existenciaSucursal) {
            const nuevaExistenciaGeneral = (existenciaSucursal.existencia || 0) + existencia;
            await existenciaSucursal.update({ 
                existencia: nuevaExistenciaGeneral 
            }, { transaction: t });
            
            // Actualizar también en Producto
            await producto.update({ 
                existencia: nuevaExistenciaGeneral 
            }, { transaction: t });
        }
        
        await t.commit();
        
        res.status(201).json({
            success: true,
            message: 'Lote creado exitosamente',
            data: nuevoLote
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear lote',
            error: error.message
        });
    }
};

// @desc    Eliminar lote (descontar existencia)
// @route   DELETE /api/inventario/lotes/:idLote
const deleteLote = async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { idLote } = req.params;
        
        const lote = await Lotes.findByPk(idLote);
        if (!lote) {
            return res.status(404).json({
                success: false,
                message: 'Lote no encontrado'
            });
        }
        
        const cantidadADescontar = lote.existencia;
        
        // Actualizar existencia en ExistenciaSucursal
        const existenciaSucursal = await ExistenciaSucursal.findOne({
            where: { 
                claveProducto: lote.claveProducto, 
                idSucursal: lote.idSucursal 
            }
        });
        
        if (existenciaSucursal) {
            const nuevaExistenciaGeneral = (existenciaSucursal.existencia || 0) - cantidadADescontar;
            await existenciaSucursal.update({ 
                existencia: nuevaExistenciaGeneral 
            }, { transaction: t });
            
            // Actualizar también en Producto
            await Producto.update(
                { existencia: nuevaExistenciaGeneral },
                { where: { claveProducto: lote.claveProducto }, transaction: t }
            );
        }
        
        // Eliminar lote
        await lote.destroy({ transaction: t });
        
        await t.commit();
        
        res.json({
            success: true,
            message: 'Lote eliminado correctamente'
        });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar lote'
        });
    }
};

// @desc    Obtener resumen de inventario
// @route   GET /api/inventario/resumen
const getResumenInventario = async (req, res) => {
    try {
         
        // 1. Productos con bajo stock (sin usar sequelize.col porque minStock puede no existir)
        const productosBajoStock = await Producto.findAll({
            where: {
                delete: false,
                status: true,
                [Op.or]: [
                    { existencia: { [Op.lte]: 5 } }, // Valor por defecto si no hay minStock
                    { existencia: 0 }
                ]
            },
            attributes: ['descripcion', 'claveProducto', 'existencia'],
            limit: 10,
            raw: true
        });
        
        // Agregar minStock calculado si no existe en la tabla
        const productosConMinStock = productosBajoStock.map(p => ({
            ...p,
            minStock: p.minStock || 5
        }));
        
        // 2. Lotes próximos a vencer (30 días)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        
        // Obtener lotes
        const lotes = await Lotes.findAll({
            where: {
                caducidad: { [Op.lte]: fechaLimite },
                existencia: { [Op.gt]: 0 }
            },
            order: [['caducidad', 'ASC']],
            limit: 10,
            raw: true
        });
        
        // Obtener productos relacionados a los lotes
        let lotesPorVencer = [];
        if (lotes.length > 0) {
            const clavesProducto = [...new Set(lotes.map(l => l.claveProducto))];
            const productos = await Producto.findAll({
                where: { 
                    claveProducto: { [Op.in]: clavesProducto },
                    delete: false 
                },
                attributes: ['claveProducto', 'descripcion'],
                raw: true
            });
            
            // Crear mapa de productos
            const productosMap = new Map(productos.map(p => [p.claveProducto, p]));
            
            // Combinar lotes con productos
            lotesPorVencer = lotes.map(lote => ({
                ...lote,
                producto: productosMap.get(lote.claveProducto) || null,
                diasRestantes: Math.ceil((new Date(lote.caducidad) - new Date()) / (1000 * 60 * 60 * 24))
            }));
        }
        
        // 3. Totales
        const [totalProductos, totalExistencia, valorInventario] = await Promise.all([
            Producto.count({ where: { delete: false } }),
            ExistenciaSucursal.sum('existencia'),
            // Calcular valor del inventario sumando producto por producto
            calcularValorInventario()
        ]);
        
        res.json({
            success: true,
            data: {
                resumen: {
                    totalProductos,
                    totalExistencia: totalExistencia || 0,
                    valorInventario: valorInventario || 0
                },
                productosBajoStock: productosConMinStock,
                lotesPorVencer
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen'
        });
    }
};

async function calcularValorInventario() {
    // Opción 1: Sumar existencia * precioP de cada producto
    const productos = await Producto.findAll({
        where: { delete: false },
        attributes: ['existencia', 'precioP'],
        raw: true
    });
    
    const total = productos.reduce((sum, p) => {
        return sum + ((p.existencia || 0) * (parseFloat(p.precioP) || 0));
    }, 0);
    
    return total;
}

module.exports = {
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
};