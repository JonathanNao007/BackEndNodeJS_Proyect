const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Movimientos = sequelize.define('Movimientos', {
    idmovimiento: {type: DataTypes.INTEGER, primaryKey: true ,autoIncrement: true},
    fecha: {},
    tipoMovimiento: {},
    idUsuario: {},
    idSucursal: {},
    referencia: {},
    idPedido: {},
    enServer: {}
});

module.exports = Movimientos;