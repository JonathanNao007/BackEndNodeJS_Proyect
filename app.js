const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Archivps de rutas
const routes = require('./routes/authRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
//
const { connectDB } = require('./database/db');
const path = require('node:path');
const FRONTEND_DIR = path.join(__dirname, './frontend');
//Modelos
const User = require('./models/User');
const Lotes = require('./models/Lotes');
const ExistenciaSucursal = require('./models/ExistenciaSucursal');
const Movimientos = require('./models/Movimientos');
const Movimientosdetalle = require('./models/Movimientosdetalle');
const Productos = require('./models/Productos');
//
dotenv.config();

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];

// Middlewares
app.use(cors({
  origin:{allowedOrigins}
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a base de datos
connectDB();
//
app.use(express.static(FRONTEND_DIR));
// Rutas
app.use('/api', routes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/movimientos', movimientosRoutes);
//
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});
// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

module.exports = app;