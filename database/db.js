const { Sequelize } = require('sequelize');
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    //Comentar dialectOptions si es local y no en digital ocean
    dialectOptions: {
      ssl: {
        // Required for DigitalOcean managed databases
        require: true,
        // Path to the CA certificate downloaded from DigitalOcean
        ca: fs.readFileSync(path.join(__dirname, 'ca-certificate.crt')),
        // Optional: set to true to verify the server's certificate against the CA
        rejectUnauthorized: true 
      }
    },
    // Optional: connection pool settings for better performance
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
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    //Comentar ssl si es local y no en digital ocean
    ssl:{
      require:true,
      ca: fs.readFileSync(path.join(__dirname, 'ca-certificate.crt')),
    }
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
    ////Sincronizacion de modelos con la base de datos.
    //await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };