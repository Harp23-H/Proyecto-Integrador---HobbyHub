const express = require('express');
const router = express.Router();

// Página de explorar
router.get('/explore', (req, res) => {
  res.render('feed/explore', { 
    title: 'Explorar - HobbyHub',
    user: null 
  });
});

// Feed principal (requiere login después)
router.get('/home', (req, res) => {
  res.render('feed/home', { 
    title: 'Inicio - HobbyHub',
    user: null 
  });
});

module.exports = router;