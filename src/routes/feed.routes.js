const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { Op } = require('sequelize');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Página de explorar (pública) - Página 5 del PDF
router.get('/explore', async (req, res) => {
    try {
        const posts = await Post.findAll({
            where: { isActive: true },
            include: [{
                model: User,  // ← SIN as
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'DESC']],
            limit: 20
        });
        
        const popularTags = await getPopularTags();
        
        res.render('feed/explore', {
            title: 'Explorar - HobbyHub',
            user: req.user || null,
            posts: posts || [],
            popularTags: popularTags || []
        });
    } catch (error) {
        console.error('Error en explore:', error);
        res.render('feed/explore', {
            title: 'Explorar - HobbyHub',
            user: req.user || null,
            posts: [],
            popularTags: [],
            error: 'Error al cargar el feed'
        });
    }
});

// Feed personalizado (requiere login) - Página 9 del PDF
router.get('/home', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const userInterests = user.intereses || [];
        
        let posts = [];
        
        if (userInterests && userInterests.length > 0) {
            const interestConditions = userInterests.map(interest => ({
                etiquetas: { [Op.like]: `%${interest}%` }
            }));
            
            posts = await Post.findAll({
                where: {
                    isActive: true,
                    [Op.or]: interestConditions
                },
                include: [{
                    model: User,  // ← SIN as
                    attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                }],
                order: [['created_at', 'DESC']],
                limit: 30
            });
        } else {
            posts = await Post.findAll({
                where: { isActive: true },
                include: [{
                    model: User,  // ← SIN as
                    attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                }],
                order: [['likes_count', 'DESC'], ['created_at', 'DESC']],
                limit: 20
            });
        }
        
        const popularTags = await getPopularTags();
        
        res.render('feed/home', {
            title: 'Inicio - HobbyHub',
            user: req.user,
            posts: posts,
            popularTags: popularTags,
            userInterests: userInterests || []
        });
        
    } catch (error) {
        console.error('Error en feed personalizado:', error);
        res.render('feed/home', {
            title: 'Inicio - HobbyHub',
            user: req.user,
            posts: [],
            popularTags: [],
            userInterests: [],
            error: 'Error al cargar tu feed: ' + error.message
        });
    }
});

// API: Obtener posts por tag específico
router.get('/tag/:tag', async (req, res) => {
    try {
        const { tag } = req.params;
        
        const posts = await Post.findAll({
            where: {
                isActive: true,
                etiquetas: { [Op.like]: `%${tag}%` }
            },
            include: [{
                model: User,  // ← SIN as
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'DESC']],
            limit: 30
        });
        
        res.render('feed/tag-results', {
            title: `#${tag} - HobbyHub`,
            user: req.user || null,
            tag: tag,
            posts: posts
        });
        
    } catch (error) {
        console.error('Error al buscar por tag:', error);
        res.status(500).send('Error al buscar publicaciones');
    }
});

// API: Agregar interés al usuario
router.post('/interests/add', isAuthenticated, async (req, res) => {
    try {
        const { interest } = req.body;
        
        if (!interest || interest.trim() === '') {
            return res.status(400).json({ error: 'Interés no válido' });
        }
        
        const user = await User.findByPk(req.user.id);
        let intereses = user.intereses || [];
        
        if (!intereses.includes(interest.toLowerCase())) {
            intereses.push(interest.toLowerCase());
            user.intereses = intereses;
            await user.save();
        }
        
        res.json({ success: true, intereses: intereses });
        
    } catch (error) {
        console.error('Error al agregar interés:', error);
        res.status(500).json({ error: 'Error al agregar interés' });
    }
});

// API: Remover interés del usuario
router.post('/interests/remove', isAuthenticated, async (req, res) => {
    try {
        const { interest } = req.body;
        
        const user = await User.findByPk(req.user.id);
        let intereses = user.intereses || [];
        
        intereses = intereses.filter(i => i !== interest);
        user.intereses = intereses;
        await user.save();
        
        res.json({ success: true, intereses: intereses });
        
    } catch (error) {
        console.error('Error al remover interés:', error);
        res.status(500).json({ error: 'Error al remover interés' });
    }
});

// Función auxiliar para obtener tags populares
async function getPopularTags() {
    try {
        const posts = await Post.findAll({
            where: { isActive: true },
            attributes: ['etiquetas'],
            limit: 100
        });
        
        const tagCount = {};
        
        posts.forEach(post => {
            const tags = post.etiquetas || [];
            tags.forEach(tag => {
                const tagLower = tag.toLowerCase();
                tagCount[tagLower] = (tagCount[tagLower] || 0) + 1;
            });
        });
        
        const popularTags = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
        
        return popularTags;
        
    } catch (error) {
        console.error('Error al obtener tags populares:', error);
        return [];
    }
}

module.exports = router;