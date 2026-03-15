const express = require('express');
const router = express.Router();

// Página de login
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Iniciar Sesión - HobbyHub',
    user: null 
  });
});

// Página de registro
router.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Registro - HobbyHub',
    user: null 
  });
});

// Procesar login (simulado por ahora)
router.post('/login', (req, res) => {
  // Aquí irá la lógica real después
  console.log('Datos de login:', req.body);
  res.redirect('/feed/explore');
});

// Procesar registro (simulado por ahora)
router.post('/register', (req, res) => {
  console.log('Datos de registro:', req.body);
  res.redirect('/auth/login');
});

// Logout
router.get('/logout', (req, res) => {
  res.redirect('/');
});

module.exports = router;