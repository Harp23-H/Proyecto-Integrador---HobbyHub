const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { Op } = require('sequelize');

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// ===== PÁGINAS DE PERFIL =====

// Ver perfil de otro usuario (Página 13 del PDF)
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const profileUser = await User.findOne({
            where: { username, isActive: true }
        });
        
        if (!profileUser) {
            return res.status(404).render('404', { 
                title: 'Usuario no encontrado', 
                user: req.user 
            });
        }
        
        // Obtener publicaciones del usuario
        const posts = await Post.findAll({
            where: { usuarioId: profileUser.id, isActive: true },
            include: [{
                model: User,
                as: 'usuario',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'DESC']],
            limit: 20
        });
        
        // Verificar si el usuario logueado sigue a este perfil
        let isFollowing = false;
        if (req.user) {
            const currentUser = await User.findByPk(req.user.id);
            isFollowing = currentUser.seguidos?.includes(profileUser.id) || false;
        }
        
        res.render('profile/view', {
            title: `${profileUser.nombres} ${profileUser.apellidos} - HobbyHub`,
            user: req.user,
            profileUser: profileUser,
            posts: posts,
            isFollowing: isFollowing,
            isOwnProfile: req.user?.id === profileUser.id
        });
        
    } catch (error) {
        console.error('Error al ver perfil:', error);
        res.status(500).send('Error al cargar el perfil');
    }
});

// Mi propio perfil (Página 18 del PDF)
router.get('/me/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        const posts = await Post.findAll({
            where: { usuarioId: req.user.id, isActive: true },
            include: [{
                model: User,
                as: 'usuario',
                attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
            }],
            order: [['created_at', 'DESC']],
            limit: 20
        });
        
        res.render('profile/my-profile', {
            title: 'Mi Perfil - HobbyHub',
            user: req.user,
            profileUser: user,
            posts: posts
        });
        
    } catch (error) {
        console.error('Error al cargar mi perfil:', error);
        res.status(500).send('Error al cargar el perfil');
    }
});

// Editar perfil (Página 17 del PDF)
router.get('/me/edit', isAuthenticated, (req, res) => {
    res.render('profile/edit', {
        title: 'Editar Perfil - HobbyHub',
        user: req.user,
        errors: null
    });
});

// Procesar edición de perfil
router.post('/me/edit', isAuthenticated, async (req, res) => {
    try {
        const { bio, instagram, twitter, tiktok, website, hobbies } = req.body;
        
        const user = await User.findByPk(req.user.id);
        
        if (bio !== undefined) user.bio = bio;
        if (instagram !== undefined) user.instagram = instagram;
        if (twitter !== undefined) user.twitter = twitter;
        if (tiktok !== undefined) user.tiktok = tiktok;
        if (website !== undefined) user.website = website;
        
        // Procesar hobbies (separados por comas)
        if (hobbies !== undefined) {
            const hobbiesArray = hobbies.split(',').map(h => h.trim()).filter(h => h);
            user.hobbies = hobbiesArray;
        }
        
        await user.save();
        
        res.redirect('/profile/me/profile');
        
    } catch (error) {
        console.error('Error al editar perfil:', error);
        res.render('profile/edit', {
            title: 'Editar Perfil - HobbyHub',
            user: req.user,
            errors: [{ msg: 'Error al guardar los cambios' }]
        });
    }
});

// ===== SISTEMA DE SEGUIDORES =====

// Seguir a un usuario
router.post('/:username/follow', isAuthenticated, async (req, res) => {
    try {
        const { username } = req.params;
        
        const userToFollow = await User.findOne({ where: { username } });
        if (!userToFollow) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const currentUser = await User.findByPk(req.user.id);
        
        let seguidos = currentUser.seguidos || [];
        if (!seguidos.includes(userToFollow.id)) {
            seguidos.push(userToFollow.id);
            currentUser.seguidos = seguidos;
            currentUser.seguidosCount = seguidos.length;
            await currentUser.save();
            
            // Incrementar contador de seguidores del otro usuario
            let seguidores = userToFollow.seguidores || [];
            if (!seguidores.includes(currentUser.id)) {
                seguidores.push(currentUser.id);
                userToFollow.seguidores = seguidores;
                userToFollow.seguidoresCount = seguidores.length;
                await userToFollow.save();
            }
        }
        
        res.json({ success: true, following: true });
        
    } catch (error) {
        console.error('Error al seguir:', error);
        res.status(500).json({ error: 'Error al seguir usuario' });
    }
});

// Dejar de seguir a un usuario
router.post('/:username/unfollow', isAuthenticated, async (req, res) => {
    try {
        const { username } = req.params;
        
        const userToUnfollow = await User.findOne({ where: { username } });
        if (!userToUnfollow) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const currentUser = await User.findByPk(req.user.id);
        
        let seguidos = currentUser.seguidos || [];
        seguidos = seguidos.filter(id => id !== userToUnfollow.id);
        currentUser.seguidos = seguidos;
        currentUser.seguidosCount = seguidos.length;
        await currentUser.save();
        
        // Decrementar contador de seguidores del otro usuario
        let seguidores = userToUnfollow.seguidores || [];
        seguidores = seguidores.filter(id => id !== currentUser.id);
        userToUnfollow.seguidores = seguidores;
        userToUnfollow.seguidoresCount = seguidores.length;
        await userToUnfollow.save();
        
        res.json({ success: true, following: false });
        
    } catch (error) {
        console.error('Error al dejar de seguir:', error);
        res.status(500).json({ error: 'Error al dejar de seguir' });
    }
});

// ===== SISTEMA DE BÚSQUEDA (Página 14 del PDF) =====

// Página de búsqueda
router.get('/search/results', async (req, res) => {
    try {
        const { q, filter = 'users' } = req.query;
        
        let users = [];
        let posts = [];
        
        if (q && q.trim() !== '') {
            const searchTerm = `%${q.toLowerCase()}%`;
            
            if (filter === 'users' || filter === 'all') {
                users = await User.findAll({
                    where: {
                        isActive: true,
                        [Op.or]: [
                            { username: { [Op.like]: searchTerm } },
                            { nombres: { [Op.like]: searchTerm } },
                            { apellidos: { [Op.like]: searchTerm } },
                            { hobbies: { [Op.like]: searchTerm } }
                        ]
                    },
                    attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil', 'bio', 'hobbies'],
                    limit: 20
                });
            }
            
            if (filter === 'posts' || filter === 'all') {
                posts = await Post.findAll({
                    where: {
                        isActive: true,
                        [Op.or]: [
                            { descripcion: { [Op.like]: searchTerm } },
                            { etiquetas: { [Op.like]: searchTerm } }
                        ]
                    },
                    include: [{
                        model: User,
                        as: 'usuario',
                        attributes: ['id', 'username', 'nombres', 'apellidos', 'fotoPerfil']
                    }],
                    order: [['created_at', 'DESC']],
                    limit: 20
                });
            }
        }
        
        res.render('search/results', {
            title: `Resultados de búsqueda: ${q || ''} - HobbyHub`,
            user: req.user,
            searchTerm: q || '',
            users: users,
            posts: posts,
            activeFilter: filter
        });
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).send('Error al realizar la búsqueda');
    }
});

module.exports = router;