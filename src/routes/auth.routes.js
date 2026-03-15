const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Mock de usuarios (temporal, hasta que tengamos BD)
let users = [];

// Página de login
router.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Iniciar Sesión - HobbyHub',
        user: null,
        errors: null
    });
});

// Página de registro
router.get('/register', (req, res) => {
    res.render('auth/register', { 
        title: 'Registro - HobbyHub',
        user: null,
        errors: null
    });
});

// Procesar registro con validaciones
router.post('/register', [
    // Validaciones
    body('nombres').notEmpty().withMessage('El nombre es requerido'),
    body('apellidos').notEmpty().withMessage('Los apellidos son requeridos'),
    body('email').isEmail().withMessage('Correo electrónico inválido'),
    body('username').notEmpty().withMessage('El nombre de usuario es requerido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las contraseñas no coinciden');
        }
        return true;
    }),
    body('fechaNacimiento').notEmpty().withMessage('La fecha de nacimiento es requerida')
], (req, res) => {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/register', {
            title: 'Registro - HobbyHub',
            user: null,
            errors: errors.array(),
            oldData: req.body
        });
    }

    // Verificar si el email ya existe
    const userExists = users.find(u => u.email === req.body.email);
    if (userExists) {
        return res.render('auth/register', {
            title: 'Registro - HobbyHub',
            user: null,
            errors: [{ msg: 'El correo electrónico ya está registrado' }],
            oldData: req.body
        });
    }

    // Crear nuevo usuario (temporal, sin encriptar)
    const newUser = {
        id: users.length + 1,
        ...req.body,
        password: req.body.password, // En fase 4 encriptaremos con bcrypt
        createdAt: new Date()
    };
    
    // Eliminar confirmPassword antes de guardar
    delete newUser.confirmPassword;
    
    users.push(newUser);
    
    console.log('Usuario registrado:', newUser);
    
    // Redirigir al login
    res.redirect('/auth/login?registered=true');
});

// Procesar login
router.post('/login', [
    body('email').isEmail().withMessage('Correo electrónico inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', {
            title: 'Iniciar Sesión - HobbyHub',
            user: null,
            errors: errors.array(),
            oldData: req.body
        });
    }

    // Buscar usuario (temporal, sin encriptar)
    const user = users.find(u => u.email === req.body.email && u.password === req.body.password);
    
    if (!user) {
        return res.render('auth/login', {
            title: 'Iniciar Sesión - HobbyHub',
            user: null,
            errors: [{ msg: 'Credenciales inválidas' }],
            oldData: req.body
        });
    }

    console.log('Usuario logueado:', user.email);
    
    // Aquí iría la sesión (fase 5)
    res.redirect('/feed/explore');
});

// Logout
router.get('/logout', (req, res) => {
    // Aquí iría la destrucción de sesión
    res.redirect('/');
});

// API endpoint para ver usuarios registrados (solo para desarrollo)
router.get('/users', (req, res) => {
    res.json(users.map(u => ({ ...u, password: undefined })));
});

module.exports = router;