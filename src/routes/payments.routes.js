const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { sequelize } = require('../config/database');

const isAuthenticated = (req, res, next) => {
    if (!req.user) return res.redirect('/auth/login');
    next();
};

// Checkout simulado (sin Stripe)
router.get('/checkout/:cursoId', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.cursoId);
        if (!course) return res.status(404).send('Curso no encontrado');
        
        res.render('payments/checkout', {
            title: `Pagar: ${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            errors: null
        });
    } catch (error) {
        res.status(500).send('Error');
    }
});

// Procesar pago simulado
router.post('/process-payment', isAuthenticated, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { cursoId, horarioSeleccionado, comentarios } = req.body;
        
        const course = await Course.findByPk(cursoId, { transaction });
        if (!course) throw new Error('Curso no encontrado');
        
        // Verificar cupo
        if (course.inscritosCount >= course.cupoMaximo) {
            throw new Error('Curso lleno');
        }
        
        // Crear inscripción (pago simulado)
        const enrollment = await Enrollment.create({
            cursoId: course.id,
            alumnoId: req.user.id,
            horarioSeleccionado: horarioSeleccionado || null,
            comentarios: comentarios || null,
            pagoRealizado: true,
            pagoId: `SIM_${Date.now()}`,
            montoPagado: course.precio,
            metodoPago: 'simulado',
            estado: 'confirmado'
        }, { transaction });
        
        course.inscritosCount += 1;
        await course.save({ transaction });
        
        await transaction.commit();
        
        res.redirect(`/payments/success?enrollmentId=${enrollment.id}`);
        
    } catch (error) {
        await transaction.rollback();
        res.render('payments/checkout', {
            title: 'Error en pago',
            user: req.user,
            course: await Course.findByPk(req.body.cursoId),
            errors: [{ msg: error.message }]
        });
    }
});

// Página de éxito
router.get('/success', isAuthenticated, async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            where: { id: req.query.enrollmentId, alumnoId: req.user.id },
            include: [{ model: Course, as: 'curso' }]
        });
        
        res.render('payments/success', {
            title: '¡Pago exitoso!',
            user: req.user,
            enrollment: enrollment
        });
    } catch (error) {
        res.redirect('/dashboard');
    }
});

module.exports = router;