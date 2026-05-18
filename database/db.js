const { Sequelize } = require('sequelize');
require('dotenv').config();
const mysql = require('mysql2/promise');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
async function crearBaseSiNoExiste() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
  await connection.end();
}
const connectDB = async () => {
  try {
    await crearBaseSiNoExiste();
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    
    // Sincronizar modelos
    console.log(sequelize.models);
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };