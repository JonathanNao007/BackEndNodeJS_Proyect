const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/db');

const ExistenciaSucursal = sequelize.define('ExistenciaSucursal', {
    id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idSucursal: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate:{
        isInt:true
    }
  },
  idProducto: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate:{
        isInt:true
    }
  },
  existencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        isInt:true
    },
    defaultValue: 0
  },
  porEntregar:{
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        isInt:true
    },
    defaultValue: 0
  },
  claveProducto: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate:{
        isInt:true
    }
  },
  codigoBarras:{
    type: DataTypes.STRING,
    allowNull:false,
    validate:{
        len:[5,25]
    }
  }
});

module.exports = ExistenciaSucursal;