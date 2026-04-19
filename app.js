const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

// Importar conexión a BD
const { connectDB } = require('./src/config/database');

const app = express();

// Conectar a MySQL
connectDB();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Importar rutas
const authRoutes = require('./src/routes/auth.routes');
const feedRoutes = require('./src/routes/feed.routes');

// Usar rutas
app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.render('feed/explore', { 
    title: 'Explora por categoría - HobbyHub',
    user: null 
  });
});

// Ruta para probar la BD
app.get('/test-db', async (req, res) => {
    try {
        const User = require('./src/models/user.js');
        const count = await User.count();
        res.json({ success: true, message: 'BD conectada', usersCount: count });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Página no encontrada',
    user: null 
  });
});

module.exports = app;