const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Course = require('../models/Course');
const User = require('../models/User');
const { sequelize } = require('../config/database');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware para verificar si es moderador/admin
const isModerator = async (req, res, next) => {
    if (!req.user || (req.user.role !== 'moderator' && req.user.role !== 'admin')) {
        return res.status(403).send('No autorizado');
    }
    next();
};

// ===== PÁGINAS PARA USUARIOS =====

// Página para reportar contenido (Página 11 del PDF)
router.get('/create/:tipo/:id', isAuthenticated, async (req, res) => {
    try {
        const { tipo, id } = req.params;
        let contenido = null;
        let titulo = '';
        
        // Verificar que el contenido existe
        switch (tipo) {
            case 'publicacion':
                contenido = await Post.findByPk(id);
                titulo = 'Publicación';
                break;
            case 'comentario':
                contenido = await Comment.findByPk(id);
                titulo = 'Comentario';
                break;
            case 'usuario':
                contenido = await User.findByPk(id);
                titulo = 'Usuario';
                break;
            case 'curso':
                contenido = await Course.findByPk(id);
                titulo = 'Curso';
                break;
            default:
                return res.status(400).send('Tipo de contenido inválido');
        }
        
        if (!contenido) {
            return res.status(404).send('Contenido no encontrado');
        }
        
        // Verificar que no haya reportado el mismo contenido antes
        const existingReport = await Report.findOne({
            where: {
                reportadoPor: req.user.id,
                tipoContenido: tipo,
                contenidoId: id,
                estado: ['pendiente', 'en_revision']
            }
        });
        
        if (existingReport) {
            return res.render('reports/already-reported', {
                title: 'Ya reportaste esto - HobbyHub',
                user: req.user,
                tipo: titulo
            });
        }
        
        res.render('reports/create', {
            title: `Reportar ${titulo} - HobbyHub`,
            user: req.user,
            tipo: tipo,
            tipoLabel: titulo,
            contenidoId: id,
            contenido: contenido,
            errors: null
        });
        
    } catch (error) {
        console.error('Error al cargar reporte:', error);
        res.status(500).send('Error al cargar la página');
    }
});

// Enviar reporte
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const { tipo, contenidoId, motivo, descripcion } = req.body;
        
        // Verificar que no haya reportado el mismo contenido antes
        const existingReport = await Report.findOne({
            where: {
                reportadoPor: req.user.id,
                tipoContenido: tipo,
                contenidoId: contenidoId,
                estado: ['pendiente', 'en_revision']
            }
        });
        
        if (existingReport) {
            return res.render('reports/already-reported', {
                title: 'Ya reportaste esto - HobbyHub',
                user: req.user,
                tipo: tipo
            });
        }
        
        // Crear reporte
        const report = await Report.create({
            reportadoPor: req.user.id,
            tipoContenido: tipo,
            contenidoId: parseInt(contenidoId),
            motivo: motivo,
            descripcion: descripcion || null,
            estado: 'pendiente'
        });
        
        console.log(`✅ Nuevo reporte creado: ID ${report.id} - Motivo: ${motivo}`);
        
        res.render('reports/success', {
            title: 'Reporte enviado - HobbyHub',
            user: req.user
        });
        
    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.render('reports/create', {
            title: 'Reportar contenido - HobbyHub',
            user: req.user,
            errors: [{ msg: 'Error al enviar el reporte. Intenta de nuevo.' }],
            tipo: req.body.tipo,
            tipoLabel: req.body.tipo,
            contenidoId: req.body.contenidoId,
            contenido: null
        });
    }
});

// ===== PÁGINAS PARA MODERADORES/ADMIN =====

// Dashboard de moderación
router.get('/moderation', isModerator, async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { estado: ['pendiente', 'en_revision'] },
            include: [{
                model: User,
                as: 'reportador',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'ASC']]
        });
        
        // Enriquecer cada reporte con los datos del contenido reportado
        const enrichedReports = await Promise.all(reports.map(async (report) => {
            let contenido = null;
            let contenidoUrl = '';
            
            switch (report.tipoContenido) {
                case 'publicacion':
                    contenido = await Post.findByPk(report.contenidoId, {
                        include: [{
                            model: User,
                            as: 'usuario',
                            attributes: ['id', 'username', 'nombres', 'apellidos']
                        }]
                    });
                    contenidoUrl = `/feed/post/${report.contenidoId}`;
                    break;
                case 'usuario':
                    contenido = await User.findByPk(report.contenidoId, {
                        attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil', 'email']
                    });
                    contenidoUrl = `/profile/${contenido?.username}`;
                    break;
                case 'curso':
                    contenido = await Course.findByPk(report.contenidoId, {
                        include: [{
                            model: User,
                            as: 'experto',
                            attributes: ['id', 'username', 'nombres', 'apellidos']
                        }]
                    });
                    contenidoUrl = `/courses/${report.contenidoId}`;
                    break;
                case 'comentario':
                    contenido = await Comment.findByPk(report.contenidoId);
                    contenidoUrl = '#';
                    break;
            }
            
            return {
                ...report.toJSON(),
                contenido: contenido,
                contenidoUrl: contenidoUrl
            };
        }));
        
        // Estadísticas de moderación
        const stats = {
            pendientes: await Report.count({ where: { estado: 'pendiente' } }),
            enRevision: await Report.count({ where: { estado: 'en_revision' } }),
            resueltos: await Report.count({ where: { estado: 'resuelto' } }),
            total: await Report.count()
        };
        
        // Reportes por motivo
        const motivosCount = await Report.findAll({
            attributes: ['motivo', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['motivo']
        });
        
        res.render('reports/moderation', {
            title: 'Moderación - HobbyHub',
            user: req.user,
            reports: enrichedReports,
            stats: stats,
            motivosCount: motivosCount
        });
        
    } catch (error) {
        console.error('Error en moderación:', error);
        res.status(500).send('Error al cargar el panel de moderación');
    }
});

// Ver detalle de un reporte
router.get('/moderation/:id', isModerator, async (req, res) => {
    try {
        const report = await Report.findOne({
            where: { id: req.params.id },
            include: [{
                model: User,
                as: 'reportador',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }]
        });
        
        if (!report) {
            return res.status(404).send('Reporte no encontrado');
        }
        
        // Obtener contenido reportado
        let contenido = null;
        let autor = null;
        
        switch (report.tipoContenido) {
            case 'publicacion':
                contenido = await Post.findByPk(report.contenidoId, {
                    include: [{
                        model: User,
                        as: 'usuario',
                        attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                    }]
                });
                autor = contenido?.usuario;
                break;
            case 'usuario':
                contenido = await User.findByPk(report.contenidoId);
                autor = contenido;
                break;
            case 'curso':
                contenido = await Course.findByPk(report.contenidoId, {
                    include: [{
                        model: User,
                        as: 'experto',
                        attributes: ['id', 'username', 'nombres', 'apellidos']
                    }]
                });
                autor = contenido?.experto;
                break;
            case 'comentario':
                contenido = await Comment.findByPk(report.contenidoId);
                break;
        }
        
        res.render('reports/moderation-detail', {
            title: `Reporte #${report.id} - Moderación`,
            user: req.user,
            report: report,
            contenido: contenido,
            autor: autor
        });
        
    } catch (error) {
        console.error('Error al ver detalle:', error);
        res.status(500).send('Error al cargar el detalle');
    }
});

// Acción de moderación
router.post('/moderation/:id/action', isModerator, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { action, accionTomada, comentario } = req.body;
        const report = await Report.findByPk(req.params.id, { transaction });
        
        if (!report) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }
        
        report.moderadoPor = req.user.id;
        report.fechaModeracion = new Date();
        report.accionTomada = `${action}: ${accionTomada || ''} ${comentario ? `- ${comentario}` : ''}`;
        
        switch (action) {
            case 'aprobar':
                report.estado = 'rechazado';
                break;
            case 'ocultar':
                report.estado = 'resuelto';
                report.contenidoOculto = true;
                
                // Ocultar el contenido según el tipo
                switch (report.tipoContenido) {
                    case 'publicacion':
                        await Post.update(
                            { isActive: false },
                            { where: { id: report.contenidoId }, transaction }
                        );
                        break;
                    case 'comentario':
                        await Comment.update(
                            { isActive: false },
                            { where: { id: report.contenidoId }, transaction }
                        );
                        break;
                    case 'curso':
                        await Course.update(
                            { isActive: false },
                            { where: { id: report.contenidoId }, transaction }
                        );
                        break;
                    case 'usuario':
                        await User.update(
                            { isActive: false },
                            { where: { id: report.contenidoId }, transaction }
                        );
                        break;
                }
                break;
            case 'suspender':
                report.estado = 'resuelto';
                await User.update(
                    { isActive: false },
                    { where: { id: report.contenidoId }, transaction }
                );
                break;
            case 'rechazar':
                report.estado = 'rechazado';
                break;
            default:
                report.estado = 'resuelto';
        }
        
        await report.save({ transaction });
        await transaction.commit();
        
        res.json({ success: true });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al procesar moderación:', error);
        res.status(500).json({ error: 'Error al procesar la acción' });
    }
});

// Historial de reportes resueltos
router.get('/moderation/history', isModerator, async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { estado: ['resuelto', 'rechazado'] },
            include: [
                { model: User, as: 'reportador', attributes: ['id', 'username'] },
                { model: User, as: 'moderador', attributes: ['id', 'username'] }
            ],
            order: [['fechaModeracion', 'DESC']],
            limit: 50
        });
        
        res.render('reports/history', {
            title: 'Historial de Reportes - HobbyHub',
            user: req.user,
            reports: reports
        });
        
    } catch (error) {
        console.error('Error en historial:', error);
        res.status(500).send('Error al cargar el historial');
    }
});

module.exports = router;