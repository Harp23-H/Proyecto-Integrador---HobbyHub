const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const { sequelize } = require('../config/database');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== PÁGINAS DE VISTAS =====

// Página para crear publicación - Paso 1 (Página 10)
router.get('/create', isAuthenticated, (req, res) => {
    res.render('posts/create-step1', {
        title: 'Nueva Publicación - HobbyHub',
        user: req.user
    });
});

// Página para crear publicación - Paso 2 (Página 11)
router.get('/create/step2', isAuthenticated, (req, res) => {
    const { imageUrl, imagePublicId } = req.query;
    res.render('posts/create-step2', {
        title: 'Agregar descripción - HobbyHub',
        user: req.user,
        imageUrl,
        imagePublicId
    });
});

// Página de éxito (Página 12)
router.get('/success', isAuthenticated, (req, res) => {
    res.render('posts/success', {
        title: '¡Publicación realizada! - HobbyHub',
        user: req.user
    });
});

// Página para ver una publicación individual (Página 12)
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id, isActive: true },
            include: [{
                association: 'usuario',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }]
        });
        
        if (!post) {
            return res.status(404).render('404', { title: 'No encontrado', user: req.user });
        }
        
        res.render('feed/post', {
            title: 'Publicación - HobbyHub',
            user: req.user,
            post
        });
    } catch (error) {
        console.error('Error al ver publicación:', error);
        res.status(500).send('Error al cargar la publicación');
    }
});

// ===== API ENDPOINTS =====

// Subir imagen a Cloudinary (Página 10)
/* router.post('/upload', isAuthenticated, upload.single('imagen'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }
        
        res.json({
            success: true,
            imageUrl: req.file.path,
            imagePublicId: req.file.filename
        });
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
}); */

router.post('/upload', isAuthenticated, upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'hobbyhub/posts' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.end(req.file.buffer); // 🔥 ahora sí existe
        });

        res.json({
            success: true,
            imageUrl: result.secure_url,
            imagePublicId: result.public_id
        });

    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

// Crear publicación (Página 11)
router.post('/create', isAuthenticated, async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { descripcion, etiquetas, ubicacion, imageUrl, imagePublicId } = req.body;
        
        // Procesar etiquetas
        let etiquetasArray = [];
        if (etiquetas) {
            etiquetasArray = etiquetas.split(',').map(t => t.trim()).filter(t => t);
        }
        
        // Crear publicación
        const post = await Post.create({
            usuarioId: req.user.id,
            imagenUrl: imageUrl,
            imagenPublicId: imagePublicId,
            descripcion: descripcion || '',
            etiquetas: etiquetasArray,
            ubicacionNombre: ubicacion || null
        }, { transaction });
        
        await transaction.commit();
        
        res.redirect('/posts/success');
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error al crear publicación:', error);
        res.status(500).send('Error al crear la publicación');
    }
});

// Editar publicación
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id, usuarioId: req.user.id }
        });
        
        if (!post) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        
        const { descripcion, etiquetas } = req.body;
        
        if (descripcion !== undefined) post.descripcion = descripcion;
        if (etiquetas !== undefined) {
            post.etiquetas = etiquetas.split(',').map(t => t.trim()).filter(t => t);
        }
        
        await post.save();
        
        res.json({ success: true, post });
        
    } catch (error) {
        console.error('Error al editar publicación:', error);
        res.status(500).json({ error: 'Error al editar la publicación' });
    }
});

// Eliminar publicación
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.id, usuarioId: req.user.id }
        });
        
        if (!post) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        
        // Marcar como inactivo en lugar de eliminar
        post.isActive = false;
        await post.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        res.status(500).json({ error: 'Error al eliminar la publicación' });
    }
});

// Dar like a publicación
router.post('/:id/like', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        
        // Aquí iría la lógica de like (necesitas modelo Like)
        post.likesCount = (post.likesCount || 0) + 1;
        await post.save();
        
        res.json({ success: true, likesCount: post.likesCount });
        
    } catch (error) {
        console.error('Error al dar like:', error);
        res.status(500).json({ error: 'Error al dar like' });
    }
});

module.exports = router;