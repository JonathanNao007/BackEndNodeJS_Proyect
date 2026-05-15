const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const Lotes = sequelize.define('Lotes', {
    idLote: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idSucursal: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate:{
        isInt
    }
  },
  claveProducto: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate:{
        isInt
    }
  },
  lote:{
    type: DataTypes.STRING,
    allowNull:false,
    validate:{
        len:[1,200]
    }
  },
  caducidad:{
    type: DataTypes.DATE,
    allowNull: false
  },
  existencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        isInt
    },
    defaultValue: 0
  },
  
});

module.exports = Lotes;