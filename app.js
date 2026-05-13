const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes/authRoutes');
const { connectDB } = require('./database/db');
const path = require('node:path');
const FRONTEND_DIR = path.join(__dirname, './frontend');
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a base de datos
connectDB();
//
app.use(express.static(FRONTEND_DIR));
// Rutas
app.use('/api', routes);
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