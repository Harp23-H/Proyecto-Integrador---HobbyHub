const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/user.js');
const { sequelize } = require('../config/database');

// Página de login
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Iniciar Sesión - HobbyHub',
        user: null,
        errors: null,
        oldData: {}
    });
});

// Página de registro
router.get('/register', (req, res) => {
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
        // Verificar errores de validación
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

        console.log(`✅ Usuario registrado en MySQL: ${newUser.email} (ID: ${newUser.id})`);

        // Redirigir al login con mensaje de éxito
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

// Procesar login con MySQL
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
                oldData: req.body
            });
        }

        // Buscar usuario por email
        const user = await User.findOne({ where: { email: req.body.email } });
        
        if (!user) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: [{ msg: 'Credenciales inválidas' }],
                oldData: req.body
            });
        }

        // Verificar si la cuenta está activa
        if (!user.isActive) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: [{ msg: 'Esta cuenta está desactivada' }],
                oldData: req.body
            });
        }

        // Comparar contraseña
        const isMatch = await user.comparePassword(req.body.password);
        
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión - HobbyHub',
                user: null,
                errors: [{ msg: 'Credenciales inválidas' }],
                oldData: req.body
            });
        }

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        console.log(`✅ Usuario logueado: ${user.email}`);

        // TEMPORAL: Mostrar mensaje de éxito
        res.send(`
            <div style="font-family: Inter, sans-serif; padding: 2rem; max-width: 500px; margin: 0 auto; text-align: center;">
                <div style="background: #10b981; color: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    ✅ ¡Login exitoso!
                </div>
                <div style="background: white; border: 1px solid #ddd; border-radius: 0.5rem; padding: 1.5rem;">
                    <h2 style="margin-bottom: 1rem;">Bienvenido, ${user.nombreCompleto()}!</h2>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Username:</strong> @${user.username}</p>
                    <p><strong>Edad:</strong> ${user.edad} años</p>
                    <hr style="margin: 1rem 0;">
                    <a href="/" style="background: #FB923C; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none;">Volver al inicio</a>
                </div>
            </div>
        `);

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.render('auth/login', {
            title: 'Iniciar Sesión - HobbyHub',
            user: null,
            errors: [{ msg: 'Error al iniciar sesión' }],
            oldData: req.body
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    res.redirect('/');
});

// API endpoint para ver usuarios (solo desarrollo)
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