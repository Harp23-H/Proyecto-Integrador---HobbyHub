const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { sequelize } = require('../config/database');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== PÁGINAS DE CONTRATACIÓN =====

// Página de checkout/contratación
router.get('/checkout/:cursoId', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.cursoId, isActive: true },
            include: [{
                model: User,
                as: 'experto',
                attributes: ['id', 'username', 'nombres', 'apellidos']
            }]
        });
        
        if (!course) {
            return res.status(404).send('Curso no encontrado');
        }
        
        // Verificar si ya está inscrito
        const existingEnrollment = await Enrollment.findOne({
            where: { cursoId: course.id, alumnoId: req.user.id }
        });
        
        if (existingEnrollment && existingEnrollment.pagoRealizado) {
            return res.redirect(`/courses/${course.id}?already_enrolled=true`);
        }
        
        res.render('enrollment/checkout', {
            title: `Contratar: ${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            errors: null
        });
        
    } catch (error) {
        console.error('Error en checkout:', error);
        res.status(500).send('Error al cargar la página de contratación');
    }
});

// Procesar contratación (sin pago real por ahora)
router.post('/checkout/:cursoId', isAuthenticated, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { horarioSeleccionado, comentarios } = req.body;
        const course = await Course.findByPk(req.params.cursoId, { transaction });
        
        if (!course) {
            await transaction.rollback();
            return res.status(404).send('Curso no encontrado');
        }
        
        // Verificar cupo disponible
        if (course.inscritosCount >= course.cupoMaximo) {
            await transaction.rollback();
            return res.render('enrollment/checkout', {
                title: `Contratar: ${course.titulo} - HobbyHub`,
                user: req.user,
                course: course,
                errors: [{ msg: 'Lo sentimos, el curso está lleno' }]
            });
        }
        
        // Verificar si ya está inscrito
        const existingEnrollment = await Enrollment.findOne({
            where: { cursoId: course.id, alumnoId: req.user.id },
            transaction
        });
        
        if (existingEnrollment) {
            await transaction.rollback();
            return res.redirect(`/courses/${course.id}?already_enrolled=true`);
        }
        
        // Crear inscripción
        const enrollment = await Enrollment.create({
            cursoId: course.id,
            alumnoId: req.user.id,
            horarioSeleccionado: horarioSeleccionado || null,
            comentarios: comentarios || null,
            pagoRealizado: true, // Por ahora simulamos pago exitoso
            montoPagado: course.precio,
            estado: 'confirmado'
        }, { transaction });
        
        // Actualizar contador de inscritos
        course.inscritosCount += 1;
        await course.save({ transaction });
        
        await transaction.commit();
        
        // Redirigir a confirmación
        res.redirect(`/enrollment/success/${enrollment.id}`);
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al procesar contratación:', error);
        res.render('enrollment/checkout', {
            title: `Contratar: ${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            errors: [{ msg: 'Error al procesar tu solicitud. Intenta de nuevo.' }]
        });
    }
});

// Página de éxito en contratación
router.get('/success/:enrollmentId', isAuthenticated, async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId, alumnoId: req.user.id },
            include: [
                { model: Course, as: 'curso' },
                { model: User, as: 'alumno' }
            ]
        });
        
        if (!enrollment) {
            return res.status(404).send('Inscripción no encontrada');
        }
        
        res.render('enrollment/success', {
            title: '¡Contratación exitosa! - HobbyHub',
            user: req.user,
            enrollment: enrollment
        });
        
    } catch (error) {
        console.error('Error en página de éxito:', error);
        res.status(500).send('Error al cargar la página');
    }
});

// Mis contrataciones (Dashboard)
router.get('/my/enrollments', isAuthenticated, async (req, res) => {
    try {
        const enrollments = await Enrollment.findAll({
            where: { alumnoId: req.user.id },
            include: [{
                model: Course,
                as: 'curso',
                include: [{
                    model: User,
                    as: 'experto',
                    attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                }]
            }],
            order: [['created_at', 'DESC']]
        });
        
        res.render('enrollment/my-enrollments', {
            title: 'Mis Contrataciones - HobbyHub',
            user: req.user,
            enrollments: enrollments
        });
        
    } catch (error) {
        console.error('Error al cargar contrataciones:', error);
        res.status(500).send('Error al cargar tus contrataciones');
    }
});

// Cancelar contratación
router.post('/:enrollmentId/cancel', isAuthenticated, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId, alumnoId: req.user.id },
            transaction
        });
        
        if (!enrollment) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        }
        
        if (enrollment.estado === 'confirmado') {
            enrollment.estado = 'cancelado';
            await enrollment.save({ transaction });
            
            // Decrementar contador del curso
            const course = await Course.findByPk(enrollment.cursoId, { transaction });
            if (course) {
                course.inscritosCount = Math.max(0, course.inscritosCount - 1);
                await course.save({ transaction });
            }
        }
        
        await transaction.commit();
        
        res.json({ success: true });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al cancelar contratación:', error);
        res.status(500).json({ error: 'Error al cancelar la contratación' });
    }
});

module.exports = router;