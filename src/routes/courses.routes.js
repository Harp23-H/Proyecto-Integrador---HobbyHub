const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { upload } = require('../config/cloudinary');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== VISTAS =====

// Crear curso - Formulario
router.get('/create', isAuthenticated, (req, res) => {
    res.render('courses/create', {
        title: 'Crear Taller - HobbyHub',
        user: req.user,
        errors: null,
        oldData: {}
    });
});

// Guardar curso
router.post('/create', isAuthenticated, upload.single('imagen'), async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const {
            titulo, descripcion, modalidad,
            plataforma, direccion, ubicacionLat, ubicacionLng,
            horarioGeneral, requisitos, nivel, duracion, precio,
            materiales, modulos, horarios
        } = req.body;
        
        // Procesar materiales
        let materialesArray = [];
        if (materiales) {
            materialesArray = Array.isArray(materiales) ? materiales : [materiales];
            materialesArray = materialesArray.filter(m => m && m.trim());
        }
        
        // Procesar módulos
        let modulosArray = [];
        if (modulos) {
            modulosArray = Array.isArray(modulos) ? modulos : [modulos];
            modulosArray = modulosArray.filter(m => m && m.trim());
        }
        
        // Procesar horarios (online)
        let horariosArray = [];
        if (modalidad === 'online' && req.body.horario_dia) {
            const dias = Array.isArray(req.body.horario_dia) ? req.body.horario_dia : [req.body.horario_dia];
            const horas = Array.isArray(req.body.horario_hora) ? req.body.horario_hora : [req.body.horario_hora];
            horariosArray = dias.map((dia, i) => ({ dia, hora: horas[i] }));
        }
        
        // Crear curso
        const courseData = {
            usuarioId: req.user.id,
            titulo,
            descripcion,
            modalidad,
            nivel: nivel || 'Principiante',
            duracion: parseFloat(duracion) || 0,
            precio: parseFloat(precio) || 0,
            materiales: materialesArray,
            modulos: modulosArray
        };
        
        // Agregar campos específicos según modalidad
        if (modalidad === 'online') {
            courseData.plataforma = plataforma;
            courseData.horarios = horariosArray;
        } else {
            courseData.direccion = direccion;
            courseData.ubicacionLat = ubicacionLat;
            courseData.ubicacionLng = ubicacionLng;
            courseData.horarioGeneral = horarioGeneral;
            courseData.requisitos = requisitos;
        }
        
        // Imagen
        if (req.file) {
            courseData.imagenUrl = req.file.path;
        }
        
        await Course.create(courseData, { transaction });
        await transaction.commit();
        
        res.redirect('/courses/my-courses?created=true');
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear curso:', error);
        res.render('courses/create', {
            title: 'Crear Taller - HobbyHub',
            user: req.user,
            errors: [{ msg: 'Error al crear el taller: ' + error.message }],
            oldData: req.body
        });
    }
});

// Mis cursos
router.get('/my-courses', isAuthenticated, async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { usuarioId: req.user.id, isActive: true },
            order: [['created_at', 'DESC']]
        });
        
        res.render('courses/my-courses', {
            title: 'Mis Talleres - HobbyHub',
            user: req.user,
            courses: courses
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/profile/me/profile');
    }
});

// Ver detalle del curso
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, isActive: true },
            include: [{
                model: User,
                as: 'instructor',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }]
        });
        
        if (!course) {
            return res.status(404).render('404', { title: 'Curso no encontrado', user: req.user });
        }
        
        const view = course.modalidad === 'online' ? 'courses/online' : 'courses/presential';
        
        res.render(view, {
            title: `${course.titulo} - HobbyHub`,
            user: req.user,
            course: course
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al cargar el curso');
    }
});

// Editar curso
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, usuarioId: req.user.id }
        });
        
        if (!course) {
            return res.redirect('/courses/my-courses');
        }
        
        res.render('courses/edit', {
            title: `Editar: ${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            errors: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/courses/my-courses');
    }
});

// Actualizar curso
router.post('/edit/:id', isAuthenticated, upload.single('imagen'), async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, usuarioId: req.user.id }
        });
        
        if (!course) {
            return res.redirect('/courses/my-courses');
        }
        
        const {
            titulo, descripcion, modalidad,
            plataforma, direccion, ubicacionLat, ubicacionLng,
            horarioGeneral, requisitos, nivel, duracion, precio
        } = req.body;
        
        course.titulo = titulo;
        course.descripcion = descripcion;
        course.modalidad = modalidad;
        course.nivel = nivel;
        course.duracion = parseFloat(duracion);
        course.precio = parseFloat(precio);
        
        if (modalidad === 'online') {
            course.plataforma = plataforma;
        } else {
            course.direccion = direccion;
            course.ubicacionLat = ubicacionLat;
            course.ubicacionLng = ubicacionLng;
            course.horarioGeneral = horarioGeneral;
            course.requisitos = requisitos;
        }
        
        if (req.file) {
            course.imagenUrl = req.file.path;
        }
        
        await course.save();
        
        res.redirect(`/courses/${course.id}?updated=true`);
        
    } catch (error) {
        console.error('Error:', error);
        res.redirect(`/courses/edit/${req.params.id}?error=true`);
    }
});

// Eliminar curso
router.post('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, usuarioId: req.user.id }
        });
        
        if (course) {
            course.isActive = false;
            await course.save();
        }
        
        res.redirect('/courses/my-courses?deleted=true');
        
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/courses/my-courses?error=true');
    }
});

module.exports = router;