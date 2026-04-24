const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Importar conexión a BD
const { connectDB } = require('./src/config/database');

const app = express();

// Conectar a MySQL
connectDB();

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi_secreto_super_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para hacer disponible el usuario en todas las vistas
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

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
const postsRoutes = require('./src/routes/posts.routes');
const profileRoutes = require('./src/routes/profile.routes');
const locationRoutes = require('./src/routes/location.routes');
const coursesRoutes = require('./src/routes/courses.routes');
const enrollmentRoutes = require('./src/routes/enrollment.routes');
const paymentsRoutes = require('./src/routes/payments.routes');


// Usar rutas
app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
app.use('/posts', postsRoutes);
app.use('/profile', profileRoutes);
app.use('/location', locationRoutes);
app.use('/courses', coursesRoutes);
app.use('/enrollment', enrollmentRoutes);
app.use('/payments', paymentsRoutes);

app.post('/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    // Esto lo maneja payments.routes.js
});
// Ruta principal
app.get('/', (req, res) => {
  res.render('feed/explore', { 
    title: 'Explora por categoría - HobbyHub',
    user: req.user
  });
});

// Ruta para probar la BD
app.get('/test-db', async (req, res) => {
    try {
        const User = require('./src/models/User');
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
    user: req.user
  });
});

module.exports = app;