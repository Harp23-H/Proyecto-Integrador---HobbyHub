const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== DASHBOARD PRINCIPAL =====

// Dashboard principal (resumen)
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Como alumno: cursos contratados
        const misCursos = await Enrollment.findAll({
            where: { alumnoId: userId },
            include: [{
                model: Course,
                as: 'curso',
                where: { isActive: true },
                required: true,
                include: [{
                    model: User,
                    as: 'experto',
                    attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                }]
            }],
            order: [['created_at', 'DESC']]
        });
        
        // Estadísticas del alumno
        const alumnoStats = {
            total: misCursos.length,
            activos: misCursos.filter(e => e.estado === 'confirmado' || e.estado === 'en_progreso').length,
            completados: misCursos.filter(e => e.estado === 'completado').length,
            totalGastado: misCursos.reduce((sum, e) => sum + parseFloat(e.montoPagado || 0), 0)
        };
        
        // Como experto: cursos que imparto
        let expertoCursos = [];
        let expertoStats = {
            total: 0,
            alumnosTotales: 0,
            ingresosTotales: 0
        };
        
        if (req.user.esExperto) {
            expertoCursos = await Course.findAll({
                where: { expertoId: userId, isActive: true },
                include: [{
                    model: Enrollment,
                    as: 'inscripciones',
                    include: [{
                        model: User,
                        as: 'alumno',
                        attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                    }]
                }],
                order: [['created_at', 'DESC']]
            });
            
            expertoStats.total = expertoCursos.length;
            expertoStats.alumnosTotales = expertoCursos.reduce((sum, c) => sum + (c.inscritosCount || 0), 0);
            expertoStats.ingresosTotales = expertoCursos.reduce((sum, c) => sum + (c.inscritosCount * parseFloat(c.precio || 0)), 0);
        }
        
        res.render('dashboard/index', {
            title: 'Mi Dashboard - HobbyHub',
            user: req.user,
            misCursos: misCursos,
            alumnoStats: alumnoStats,
            expertoCursos: expertoCursos,
            expertoStats: expertoStats,
            esExperto: req.user.esExperto
        });
        
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).send('Error al cargar el dashboard');
    }
});

// ===== MIS CURSOS (Alumno) =====

// Ver detalle de un curso contratado
router.get('/my-course/:enrollmentId', isAuthenticated, async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId, alumnoId: req.user.id },
            include: [{
                model: Course,
                as: 'curso',
                include: [{
                    model: User,
                    as: 'experto',
                    attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil', 'bio']
                }]
            }]
        });
        
        if (!enrollment) {
            return res.status(404).send('Curso no encontrado');
        }
        
        res.render('dashboard/my-course-detail', {
            title: `${enrollment.curso.titulo} - Mi Curso`,
            user: req.user,
            enrollment: enrollment
        });
        
    } catch (error) {
        console.error('Error al ver detalle del curso:', error);
        res.status(500).send('Error al cargar el detalle');
    }
});

// Actualizar progreso del curso
router.post('/update-progress/:enrollmentId', isAuthenticated, async (req, res) => {
    try {
        const { progreso } = req.body;
        
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId, alumnoId: req.user.id }
        });
        
        if (!enrollment) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        enrollment.progreso = Math.min(100, Math.max(0, parseInt(progreso) || 0));
        
        if (enrollment.progreso === 100 && enrollment.estado !== 'completado') {
            enrollment.estado = 'completado';
            enrollment.fechaCompletado = new Date();
        } else if (enrollment.progreso > 0 && enrollment.estado === 'confirmado') {
            enrollment.estado = 'en_progreso';
        }
        
        await enrollment.save();
        
        res.json({ success: true, progreso: enrollment.progreso, estado: enrollment.estado });
        
    } catch (error) {
        console.error('Error al actualizar progreso:', error);
        res.status(500).json({ error: 'Error al actualizar el progreso' });
    }
});

// Dar calificación al curso
router.post('/rate-course/:enrollmentId', isAuthenticated, async (req, res) => {
    try {
        const { calificacion, comentario } = req.body;
        
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId, alumnoId: req.user.id },
            include: [{ model: Course, as: 'curso' }]
        });
        
        if (!enrollment) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        enrollment.calificacion = parseFloat(calificacion);
        enrollment.comentarios = comentario || null;
        await enrollment.save();
        
        // Actualizar rating del experto
        const course = enrollment.curso;
        const allRatings = await Enrollment.findAll({
            where: { cursoId: course.id, calificacion: { [Op.not]: null } },
            attributes: ['calificacion']
        });
        
        const avgRating = allRatings.reduce((sum, e) => sum + parseFloat(e.calificacion), 0) / allRatings.length;
        course.rating = avgRating;
        course.totalResenas = allRatings.length;
        await course.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al calificar curso:', error);
        res.status(500).json({ error: 'Error al calificar el curso' });
    }
});

// ===== MIS CURSOS (Experto) =====

// Ver alumnos de un curso (Experto)
router.get('/course-students/:cursoId', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            where: { id: req.params.cursoId, expertoId: req.user.id }
        });
        
        if (!course) {
            return res.status(404).send('Curso no encontrado');
        }
        
        const enrollments = await Enrollment.findAll({
            where: { cursoId: course.id },
            include: [{
                model: User,
                as: 'alumno',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil', 'email']
            }],
            order: [['created_at', 'DESC']]
        });
        
        res.render('dashboard/course-students', {
            title: `Alumnos - ${course.titulo}`,
            user: req.user,
            course: course,
            enrollments: enrollments
        });
        
    } catch (error) {
        console.error('Error al ver alumnos:', error);
        res.status(500).send('Error al cargar los alumnos');
    }
});

// Dar feedback a un alumno (Experto)
router.post('/give-feedback/:enrollmentId', isAuthenticated, async (req, res) => {
    try {
        const { feedback } = req.body;
        
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId },
            include: [{
                model: Course,
                as: 'curso',
                where: { expertoId: req.user.id }
            }]
        });
        
        if (!enrollment) {
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        }
        
        enrollment.feedbackExperto = feedback;
        await enrollment.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al enviar feedback:', error);
        res.status(500).json({ error: 'Error al enviar el feedback' });
    }
});

// Marcar curso como completado para un alumno (Experto)
router.post('/complete-student/:enrollmentId', isAuthenticated, async (req, res) => {
    try {
        const enrollment = await Enrollment.findOne({
            where: { id: req.params.enrollmentId },
            include: [{
                model: Course,
                as: 'curso',
                where: { expertoId: req.user.id }
            }]
        });
        
        if (!enrollment) {
            return res.status(404).json({ error: 'Inscripción no encontrada' });
        }
        
        enrollment.estado = 'completado';
        enrollment.progreso = 100;
        enrollment.fechaCompletado = new Date();
        await enrollment.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al completar alumno:', error);
        res.status(500).json({ error: 'Error al completar el curso' });
    }
});

// Estadísticas detalladas del experto
router.get('/expert-stats', isAuthenticated, async (req, res) => {
    try {
        if (!req.user.esExperto) {
            return res.redirect('/dashboard');
        }
        
        const courses = await Course.findAll({
            where: { expertoId: req.user.id, isActive: true },
            include: [{
                model: Enrollment,
                as: 'inscripciones'
            }]
        });
        
        // Estadísticas por mes
        const monthlyStats = {};
        const last6Months = [];
        
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            last6Months.unshift(monthKey);
            monthlyStats[monthKey] = { ingresos: 0, alumnos: 0 };
        }
        
        courses.forEach(course => {
            course.inscripciones?.forEach(enrollment => {
                const date = new Date(enrollment.created_at);
                const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                if (monthlyStats[monthKey]) {
                    monthlyStats[monthKey].ingresos += parseFloat(enrollment.montoPagado || 0);
                    monthlyStats[monthKey].alumnos += 1;
                }
            });
        });
        
        res.render('dashboard/expert-stats', {
            title: 'Mis Estadísticas - HobbyHub',
            user: req.user,
            courses: courses,
            monthlyStats: monthlyStats,
            last6Months: last6Months
        });
        
    } catch (error) {
        console.error('Error en estadísticas:', error);
        res.status(500).send('Error al cargar estadísticas');
    }
});

module.exports = router;