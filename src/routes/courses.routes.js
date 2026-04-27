const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinary');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== FUNCIÓN PARA SUBIR IMAGEN A CLOUDINARY =====
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder || 'hobbyhub/courses',
                allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                transformation: [{ width: 1200, height: 800, crop: 'limit' }]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

// ===== PÁGINAS PÚBLICAS =====

// Página para explorar cursos
router.get('/explore', async (req, res) => {
    try {
        const { modalidad, nivel, search } = req.query;
        
        let whereConditions = { isActive: true };
        
        if (search) {
            whereConditions = {
                ...whereConditions,
                [Op.or]: [
                    { titulo: { [Op.like]: `%${search}%` } },
                    { descripcion: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        
        if (modalidad && modalidad !== 'todos') {
            whereConditions.modalidad = modalidad;
        }
        
        if (nivel && nivel !== 'todos') {
            whereConditions.nivel = nivel;
        }
        
        const courses = await Course.findAll({
            where: whereConditions,
            include: [{
                model: User,
                as: 'experto',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'DESC']]
        });
        
        res.render('courses/explore', {
            title: 'Explorar Cursos - HobbyHub',
            user: req.user || null,
            courses: courses || [],
            error: null,
            filtros: { modalidad, nivel, search }
        });
        
    } catch (error) {
        console.error('Error en explorar cursos:', error);
        res.render('courses/explore', {
            title: 'Explorar Cursos - HobbyHub',
            user: req.user || null,
            courses: [],
            filtros: {},
            error: 'Error al cargar los cursos'
        });
    }
});

// Lista de todos los cursos
router.get('/', async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { isActive: true },
            include: [{
                model: User,
                as: 'experto',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'DESC']]
        });
        
        res.render('courses/list', {
            title: 'Cursos y Talleres - HobbyHub',
            user: req.user || null,
            courses: courses
        });
    } catch (error) {
        console.error('Error al listar cursos:', error);
        res.status(500).send('Error al cargar los cursos');
    }
});

// Ver detalle de un curso
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, isActive: true },
            include: [{
                model: User,
                as: 'experto',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil', 'bio']
            }]
        });
        
        if (!course) {
            return res.status(404).render('404', { title: 'Curso no encontrado', user: req.user });
        }
        
        let isEnrolled = false;
        if (req.user) {
            const enrollment = await Enrollment.findOne({
                where: { cursoId: course.id, alumnoId: req.user.id }
            });
            isEnrolled = !!enrollment;
        }
        
        const template = course.modalidad === 'presencial' ? 'courses/presential' : 'courses/online';
        
        res.render(template, {
            title: `${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            isEnrolled: isEnrolled
        });
        
    } catch (error) {
        console.error('Error al ver curso:', error);
        res.status(500).send('Error al cargar el curso');
    }
});

// ===== PÁGINAS DE CREACIÓN/EDICIÓN =====

// Crear curso
router.get('/create', isAuthenticated, (req, res) => {
    res.render('courses/create', {
        title: 'Crear Curso/Taller - HobbyHub',
        user: req.user,
        errors: null
    });
});

// Procesar creación del curso con Cloudinary
router.post('/create', isAuthenticated, upload.single('imagen'), async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Subir imagen a Cloudinary
        let imagenUrl = '/images/default-course.jpg';
        let imagenPublicId = null;
        
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'hobbyhub/courses');
            imagenUrl = result.secure_url;
            imagenPublicId = result.public_id;
        }
        
        const {
            titulo, descripcion, modalidad, nivel, duracion, precio,
            direccion, requisitos, plataforma, enlaceReunion,
            materiales, modulos, horario, horariosDisponibles,
            cupoMaximo, fechaInicio, fechaFin
        } = req.body;
        
        let materialesArray = [];
        if (materiales) {
            materialesArray = materiales.split(',').map(m => m.trim()).filter(m => m);
        }
        
        let modulosArray = [];
        if (modulos) {
            modulosArray = modulos.split('\n').filter(m => m.trim());
        }
        
        let horariosArray = [];
        if (horariosDisponibles) {
            horariosArray = horariosDisponibles.split(',').map(h => h.trim());
        }
        
        let requisitosArray = [];
        if (requisitos) {
            requisitosArray = requisitos.split('\n').filter(r => r.trim());
        }
        
        const courseData = {
            expertoId: req.user.id,
            titulo,
            descripcion,
            modalidad,
            nivel: nivel || 'principiante',
            duracion: duracion ? parseInt(duracion) : null,
            precio: parseFloat(precio) || 0,
            horario: horario || '',
            cupoMaximo: cupoMaximo ? parseInt(cupoMaximo) : 20,
            materiales: materialesArray,
            modulos: modulosArray,
            horariosDisponibles: horariosArray,
            requisitos: requisitosArray,
            imagenUrl: imagenUrl,
            imagenPublicId: imagenPublicId
        };
        
        if (modalidad === 'presencial') {
            courseData.direccion = direccion;
            courseData.ubicacionLat = req.body.ubicacionLat;
            courseData.ubicacionLng = req.body.ubicacionLng;
        } else {
            courseData.plataforma = plataforma || 'zoom';
            courseData.enlaceReunion = enlaceReunion;
        }
        
        if (fechaInicio) courseData.fechaInicio = new Date(fechaInicio);
        if (fechaFin) courseData.fechaFin = new Date(fechaFin);
        
        await Course.create(courseData, { transaction });
        await transaction.commit();
        
        res.redirect('/dashboard');
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear curso:', error);
        res.render('courses/create', {
            title: 'Crear Curso/Taller - HobbyHub',
            user: req.user,
            errors: [{ msg: 'Error al crear el curso: ' + error.message }]
        });
    }
});

// Editar curso
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, expertoId: req.user.id, isActive: true }
        });
        
        if (!course) {
            return res.status(404).send('Curso no encontrado o no tienes permiso');
        }
        
        res.render('courses/edit', {
            title: `Editar: ${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            errors: null
        });
        
    } catch (error) {
        console.error('Error al cargar edición:', error);
        res.status(500).send('Error al cargar la página de edición');
    }
});

// Actualizar curso
router.put('/:id', isAuthenticated, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, expertoId: req.user.id, isActive: true },
            transaction
        });
        
        if (!course) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        const {
            titulo, descripcion, modalidad, nivel, duracion, precio,
            direccion, requisitos, plataforma, enlaceReunion,
            materiales, modulos, horario, horariosDisponibles,
            cupoMaximo, fechaInicio, fechaFin
        } = req.body;
        
        course.titulo = titulo || course.titulo;
        course.descripcion = descripcion || course.descripcion;
        course.modalidad = modalidad || course.modalidad;
        course.nivel = nivel || course.nivel;
        course.duracion = duracion ? parseInt(duracion) : course.duracion;
        course.precio = parseFloat(precio) || course.precio;
        course.horario = horario || course.horario;
        course.cupoMaximo = cupoMaximo ? parseInt(cupoMaximo) : course.cupoMaximo;
        
        if (materiales) {
            course.materiales = materiales.split(',').map(m => m.trim()).filter(m => m);
        }
        
        if (modulos) {
            course.modulos = modulos.split('\n').filter(m => m.trim());
        }
        
        if (horariosDisponibles) {
            course.horariosDisponibles = horariosDisponibles.split(',').map(h => h.trim());
        }
        
        if (requisitos) {
            course.requisitos = requisitos.split('\n').filter(r => r.trim());
        }
        
        if (modalidad === 'presencial') {
            course.direccion = direccion || course.direccion;
            course.ubicacionLat = req.body.ubicacionLat || course.ubicacionLat;
            course.ubicacionLng = req.body.ubicacionLng || course.ubicacionLng;
        } else {
            course.plataforma = plataforma || course.plataforma;
            course.enlaceReunion = enlaceReunion || course.enlaceReunion;
        }
        
        if (fechaInicio) course.fechaInicio = new Date(fechaInicio);
        if (fechaFin) course.fechaFin = new Date(fechaFin);
        
        await course.save({ transaction });
        await transaction.commit();
        
        res.json({ success: true, redirectUrl: `/courses/${course.id}` });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al actualizar curso:', error);
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
});

// Subir/Actualizar imagen del curso con Cloudinary
router.post('/:id/upload-image', isAuthenticated, upload.single('imagen'), async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, expertoId: req.user.id }
        });
        
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }
        
        // Eliminar imagen anterior de Cloudinary si existe
        if (course.imagenPublicId) {
            try {
                await cloudinary.uploader.destroy(course.imagenPublicId);
            } catch (err) {
                console.error('Error al eliminar imagen anterior:', err);
            }
        }
        
        // Subir nueva imagen
        const result = await uploadToCloudinary(req.file.buffer, 'hobbyhub/courses');
        
        course.imagenUrl = result.secure_url;
        course.imagenPublicId = result.public_id;
        await course.save();
        
        res.json({ success: true, imageUrl: course.imagenUrl });
        
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

// Eliminar curso
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.id, expertoId: req.user.id }
        });
        
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        // Eliminar imagen de Cloudinary (opcional, si quieres mantenerla comenta esto)
        if (course.imagenPublicId) {
            try {
                await cloudinary.uploader.destroy(course.imagenPublicId);
            } catch (err) {
                console.error('Error al eliminar imagen de Cloudinary:', err);
            }
        }
        
        course.isActive = false;
        await course.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al eliminar curso:', error);
        res.status(500).json({ error: 'Error al eliminar el curso' });
    }
});

module.exports = router;