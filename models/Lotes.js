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
        isInt:true
    }
  },
  claveProducto: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate:{
        isInt:true
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
        isInt:true
    },
    defaultValue: 0
  },
  recibidos:{
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
        isInt:true
    },
    defaultValue: 0
  },
  fechaRegistro:{
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  codigoBarras:{
    type: DataTypes.STRING,
    allowNull:false,
    validate:{
        len:[5,25]
    }
  }
});


module.exports = Lotes;