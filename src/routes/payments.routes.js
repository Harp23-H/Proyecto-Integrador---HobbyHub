const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { sequelize } = require('../config/database');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== PÁGINAS DE PAGO =====

// Página de checkout con Stripe (Página 16 del PDF)
router.get('/checkout/:cursoId', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.cursoId, isActive: true },
            include: [{
                model: require('../models/User'),
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
        
        res.render('payments/checkout', {
            title: `Pagar: ${course.titulo} - HobbyHub`,
            user: req.user,
            course: course,
            stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
            errors: null
        });
        
    } catch (error) {
        console.error('Error en checkout:', error);
        res.status(500).send('Error al cargar la página de pago');
    }
});

// Crear sesión de pago con Stripe
router.post('/create-payment-session', isAuthenticated, async (req, res) => {
    try {
        const { cursoId, horarioSeleccionado, comentarios } = req.body;
        
        const course = await Course.findByPk(cursoId);
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        // Crear sesión de checkout en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: course.titulo,
                            description: course.descripcion.substring(0, 200),
                            images: course.imagenUrl ? [course.imagenUrl] : [],
                        },
                        unit_amount: Math.round(course.precio * 100), // Stripe usa centavos
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.APP_URL || 'http://localhost:3000'}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/payments/cancel`,
            metadata: {
                cursoId: course.id,
                alumnoId: req.user.id,
                horarioSeleccionado: horarioSeleccionado || '',
                comentarios: comentarios || ''
            },
            customer_email: req.user.email,
        });
        
        res.json({ sessionId: session.id, url: session.url });
        
    } catch (error) {
        console.error('Error al crear sesión de pago:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

// Webhook para confirmar pagos (requiere endpoint público)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Error en webhook:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Manejar evento de checkout completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { cursoId, alumnoId, horarioSeleccionado, comentarios } = session.metadata;
        
        const transaction = await sequelize.transaction();
        
        try {
            // Verificar si ya existe la inscripción
            const existingEnrollment = await Enrollment.findOne({
                where: { cursoId, alumnoId },
                transaction
            });
            
            if (!existingEnrollment) {
                // Crear inscripción
                await Enrollment.create({
                    cursoId: parseInt(cursoId),
                    alumnoId: parseInt(alumnoId),
                    horarioSeleccionado: horarioSeleccionado || null,
                    comentarios: comentarios || null,
                    pagoRealizado: true,
                    pagoId: session.id,
                    montoPagado: session.amount_total / 100,
                    metodoPago: 'stripe',
                    estado: 'confirmado'
                }, { transaction });
                
                // Actualizar contador del curso
                const course = await Course.findByPk(cursoId, { transaction });
                if (course) {
                    course.inscritosCount += 1;
                    await course.save({ transaction });
                }
            }
            
            await transaction.commit();
            console.log(`✅ Pago completado para curso ${cursoId} por usuario ${alumnoId}`);
            
        } catch (error) {
            await transaction.rollback();
            console.error('Error al procesar webhook:', error);
        }
    }
    
    res.json({ received: true });
});

// Página de éxito después del pago
router.get('/success', isAuthenticated, async (req, res) => {
    try {
        const { session_id } = req.query;
        
        if (!session_id) {
            return res.redirect('/courses');
        }
        
        // Buscar la inscripción por el ID de sesión
        const enrollment = await Enrollment.findOne({
            where: { pagoId: session_id, alumnoId: req.user.id },
            include: [{
                model: Course,
                as: 'curso',
                include: [{
                    model: require('../models/User'),
                    as: 'experto',
                    attributes: ['id', 'username', 'nombres', 'apellidos']
                }]
            }]
        });
        
        if (!enrollment) {
            return res.redirect('/courses');
        }
        
        res.render('payments/success', {
            title: '¡Pago exitoso! - HobbyHub',
            user: req.user,
            enrollment: enrollment
        });
        
    } catch (error) {
        console.error('Error en página de éxito:', error);
        res.status(500).send('Error al cargar la página de éxito');
    }
});

// Página de cancelación de pago
router.get('/cancel', isAuthenticated, (req, res) => {
    res.render('payments/cancel', {
        title: 'Pago cancelado - HobbyHub',
        user: req.user
    });
});

module.exports = router;