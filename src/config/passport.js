const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/User');
const { sequelize } = require('./database');

// Serialización y deserialización de usuario
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ===== ESTRATEGIA DE GOOGLE =====
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No se pudo obtener el email de Google'), null);
        }

        // Buscar usuario por email o authProviderId
        let user = await User.findOne({
            where: {
                [sequelize.Op.or]: [
                    { email: email },
                    { authProviderId: profile.id, authProvider: 'google' }
                ]
            }
        });

        if (!user) {
            // Crear nuevo usuario
            user = await User.create({
                nombres: profile.name?.givenName || 'Usuario',
                apellidos: profile.name?.familyName || 'Google',
                email: email,
                username: `google_${profile.id.substring(0, 15)}`,
                password: Math.random().toString(36).slice(-16), // Password aleatorio
                fechaNacimiento: '2000-01-01', // Fecha por defecto
                edad: 25,
                authProvider: 'google',
                authProviderId: profile.id,
                isVerified: true,
                fotoPerfil: profile.photos?.[0]?.value || '/images/default-avatar.png'
            });
            console.log(`✅ Usuario creado con Google: ${email}`);
        } else {
            console.log(`✅ Usuario logueado con Google: ${email}`);
        }

        return done(null, user);
    } catch (error) {
        console.error('❌ Error en Google Strategy:', error);
        return done(error, null);
    }
}));

// ===== ESTRATEGIA DE FACEBOOK =====
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'name', 'emails', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;
        
        let user = await User.findOne({
            where: {
                [sequelize.Op.or]: [
                    { email: email },
                    { authProviderId: profile.id, authProvider: 'facebook' }
                ]
            }
        });

        if (!user) {
            const nombres = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Usuario';
            const apellidos = profile.name?.familyName || profile.displayName?.split(' ')[1] || 'Facebook';
            
            user = await User.create({
                nombres: nombres,
                apellidos: apellidos,
                email: email,
                username: `fb_${profile.id.substring(0, 15)}`,
                password: Math.random().toString(36).slice(-16),
                fechaNacimiento: '2000-01-01',
                edad: 25,
                authProvider: 'facebook',
                authProviderId: profile.id,
                isVerified: true,
                fotoPerfil: profile.photos?.[0]?.value || '/images/default-avatar.png'
            });
            console.log(`✅ Usuario creado con Facebook: ${email}`);
        } else {
            console.log(`✅ Usuario logueado con Facebook: ${email}`);
        }

        return done(null, user);
    } catch (error) {
        console.error('❌ Error en Facebook Strategy:', error);
        return done(error, null);
    }
}));

// ===== ESTRATEGIA DE X (TWITTER) =====
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CLIENT_ID,
    consumerSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: '/auth/twitter/callback',
    includeEmail: true
}, async (token, tokenSecret, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value || `${profile.id}@twitter.com`;
        
        let user = await User.findOne({
            where: {
                [sequelize.Op.or]: [
                    { email: email },
                    { authProviderId: profile.id, authProvider: 'twitter' }
                ]
            }
        });

        if (!user) {
            const nombres = profile.displayName?.split(' ')[0] || 'Usuario';
            const apellidos = profile.displayName?.split(' ')[1] || 'Twitter';
            
            user = await User.create({
                nombres: nombres,
                apellidos: apellidos,
                email: email,
                username: `tw_${profile.id.substring(0, 15)}`,
                password: Math.random().toString(36).slice(-16),
                fechaNacimiento: '2000-01-01',
                edad: 25,
                authProvider: 'twitter',
                authProviderId: profile.id,
                isVerified: true,
                fotoPerfil: profile.photos?.[0]?.value || '/images/default-avatar.png'
            });
            console.log(`✅ Usuario creado con X: ${email}`);
        } else {
            console.log(`✅ Usuario logueado con X: ${email}`);
        }

        return done(null, user);
    } catch (error) {
        console.error('❌ Error en X Strategy:', error);
        return done(error, null);
    }
}));

module.exports = passport;