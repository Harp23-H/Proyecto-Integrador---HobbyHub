const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { sequelize } = require('../config/database');

// ===== RUTAS DE AUTENTICACIÓN SOCIAL =====

// Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/login' }),
    (req, res) => {
        res.redirect('/feed/explore');
    }
);

// Facebook
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth/login' }),
    (req, res) => {
        res.redirect('/feed/explore');
    }
);

// X (Twitter)
router.get('/twitter',
    passport.authenticate('twitter')
);

router.get('/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/auth/login' }),
    (req, res) => {
        res.redirect('/feed/explore');
    }
);

// Apple
router.get('/apple',
    passport.authenticate('apple')
);

router.get('/apple/callback',
    passport.authenticate('apple', { failureRedirect: '/auth/login' }),
    (req, res) => {
        res.redirect('/feed/explore');
    }
);

// ===== RUTAS DE AUTENTICACIÓN TRADICIONAL =====

// Página de login
router.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/feed/explore');
    }
    res.render('auth/login', { 
        title: 'Iniciar Sesión - HobbyHub',
        user: null,
        errors: null,
        oldData: {},
        message: req.query.registered ? '✅ ¡Registro exitoso! Ahora inicia sesión' : null
    });
});

// Página de registro
router.get('/register', (req, res) => {
    if (req.user) {
        return res.redirect('/feed/explore');
    }
    res.render('auth/register', { 
        title: 'Registro - HobbyHub',
        user: null,
        errors: null,
        oldData: {}
    });
});

// Procesar registro con MySQL
router.post('/register', [
    body('nombres').notEmpty().withMessage('El nombre es requerido'),
    body('apellidos').notEmpty().withMessage('Los apellidos son requeridos'),
    body('email').isEmail().withMessage('Correo electrónico inválido'),
    body('username')
        .notEmpty().withMessage('El nombre de usuario es requerido')
        .isLength({ min: 3 }).withMessage('El username debe tener al menos 3 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, números y guión bajo'),
    body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las contraseñas no coinciden');
        }
        return true;
    }),
    body('fechaNacimiento')
        .notEmpty().withMessage('La fecha de nacimiento es requerida')
        .custom((value) => {
            const fecha = new Date(value);
            const hoy = new Date();
            const edad = hoy.getFullYear() - fecha.getFullYear();
            if (edad < 13) {
                throw new Error('Debes tener al menos 13 años para registrarte');
            }
            return true;
        })
], async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await transaction.rollback();
            return res.render('auth/register', {
                title: 'Registro - HobbyHub',
                user: null,
                errors: errors.array(),
                oldData: req.body
            });
        }

        // Verificar si el email ya existe
        const existingEmail = await User.findOne({ where: { email: req.body.email }, transaction });
        if (existingEmail) {
            await transaction.rollback();
            return res.render('auth/register', {
                title: 'Registro - HobbyHub',
                user: null,
                errors: [{ msg: 'El correo electrónico ya está registrado' }],
                oldData: req.body
            });
        }

        // Verificar si el username ya existe
        const existingUsername = await User.findOne({ where: { username: req.body.username }, transaction });
        if (existingUsername) {
            await transaction.rollback();
            return res.render('auth/register', {
                title: 'Registro - HobbyHub',
                user: null,
                errors: [{ msg: 'El nombre de usuario ya está en uso' }],
                oldData: req.body
            });
        }

        // Calcular edad
        const fechaNac = new Date(req.body.fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
        }

        // Crear nuevo usuario
        const newUser = await User.create({
            nombres: req.body.nombres,
            apellidos: req.body.apellidos,
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
            fechaNacimiento: req.body.fechaNacimiento,
            edad: edad,
            hobbies: []
        }, { transaction });

        await transaction.commit();

        console.log(`✅ Usuario registrado: ${newUser.email} (ID: ${newUser.id})`);
        res.redirect('/auth/login?registered=true');

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en registro:', error);
        res.render('auth/register', {
            title: 'Registro - HobbyHub',
            user: null,
            errors: [{ msg: 'Error al registrar usuario. Intenta de nuevo.' }],
            oldData: req.body
        });
    }
});

// Procesar login tradicional
router.post('/login', [
    body('email').isEmail().withMessage('Correo electrónico inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: errors.array(),
                oldData: req.body,
                message: null
            });
        }

        const user = await User.findOne({ where: { email: req.body.email } });
        
        if (!user) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: [{ msg: 'Credenciales inválidas' }],
                oldData: req.body,
                message: null
            });
        }

        if (!user.isActive) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: [{ msg: 'Esta cuenta está desactivada' }],
                oldData: req.body,
                message: null
            });
        }

        const isMatch = await user.comparePassword(req.body.password);
        
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: [{ msg: 'Credenciales inválidas' }],
                oldData: req.body,
                message: null
            });
        }

        // Iniciar sesión manualmente (sin Passport por ahora)
        req.login(user, (err) => {
            if (err) throw err;
            user.lastLogin = new Date();
            user.save();
            console.log(`✅ Usuario logueado: ${user.email}`);
            res.redirect('/feed/explore');
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.render('auth/login', {
            title: 'Iniciar Sesión - HobbyHub',
            user: null,
            errors: [{ msg: 'Error al iniciar sesión' }],
            oldData: req.body,
            message: null
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('❌ Error en logout:', err);
        }
        res.redirect('/');
    });
});

// API endpoint para ver usuarios
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;