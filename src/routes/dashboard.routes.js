const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        
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
        
        const alumnoStats = {
            total: misCursos.length,
            activos: misCursos.filter(e => e.estado === 'confirmado' || e.estado === 'en_progreso').length,
            completados: misCursos.filter(e => e.estado === 'completado').length,
            totalGastado: misCursos.reduce((sum, e) => sum + parseFloat(e.montoPagado || 0), 0)
        };
        
        const expertoCursos = await Course.findAll({
            where: { expertoId: userId, isActive: true },
            order: [['created_at', 'DESC']]
        });
        
        const expertoStats = {
            total: expertoCursos.length,
            alumnosTotales: expertoCursos.reduce((sum, c) => sum + (c.inscritosCount || 0), 0),
            ingresosTotales: expertoCursos.reduce((sum, c) => sum + (c.inscritosCount * parseFloat(c.precio || 0)), 0)
        };
        
        res.render('dashboard/index', {
            title: 'Mi Dashboard - HobbyHub',
            user: req.user,
            misCursos: misCursos,
            alumnoStats: alumnoStats,
            expertoCursos: expertoCursos,
            expertoStats: expertoStats
        });
        
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).send('Error al cargar el dashboard');
    }
});

module.exports = router;