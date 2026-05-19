const express = require('express');
const router = express.Router();
const {
  home,
  register,
  login,
  getProfile,
  getUsers,
  updateUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Rutas públicas
//router.get('/', home);
router.post('/auth/register', register);
router.post('/auth/login', login);

// Rutas privadas
router.get('/auth/profile', protect, getProfile);
router.get('/auth/users', protect, authorize('admin'), getUsers);
router.put('/auth/users/:id', protect, authorize('admin'), updateUser);

module.exports = router;