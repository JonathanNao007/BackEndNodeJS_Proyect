const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Movimientos = sequelize.define('Movimientos', {
    idmovimiento: {type: DataTypes.INTEGER, primaryKey: true ,autoIncrement: true},
    fecha: {type: DataTypes.DATE , allowNull: false , defaultValue: DataTypes.NOW},
    tipoMovimiento: {type: DataTypes.STRING, allowNull: false ,validate: {len: [1, 50]}},
    idUsuario: {type: DataTypes.BIGINT, allowNull: false ,validate: {isInt:true}},
    idSucursal: {type: DataTypes.BIGINT, allowNull: false ,validate: {isInt:true}},
    referencia: {type: DataTypes.STRING, allowNull: false ,validate: {len: [1, 50]}},
    idPedido: {type: DataTypes.BIGINT, allowNull: true ,validate: {isInt:true}},
    enServer: {type: DataTypes.BOOLEAN , allowNull:false , defaultValue: false}
});

module.exports = Movimientos;