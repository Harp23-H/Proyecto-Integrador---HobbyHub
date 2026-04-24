const passport = require('passport');
const User = require('../models/User');

// ===== SERIALIZACIÓN Y DESERIALIZACIÓN DE USUARIO =====
// Guarda solo el ID del usuario en la sesión
passport.serializeUser((user, done) => {
    console.log('📝 Serializando usuario:', user.id);
    done(null, user.id);
});

// Recupera el usuario completo desde el ID guardado en la sesión
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] } // No enviar la contraseña
        });
        
        if (!user) {
            console.log('⚠️ Usuario no encontrado en deserialize:', id);
            return done(null, null);
        }
        
        console.log('✅ Deserializando usuario:', user.id, '-', user.email);
        done(null, user);
    } catch (error) {
        console.error('❌ Error en deserializeUser:', error);
        done(error, null);
    }
});

// ===== NOTA: ESTRATEGIAS DE AUTENTICACIÓN SOCIAL =====
// Las estrategias de Google, Facebook, Apple y Twitter han sido eliminadas
// ya que requieren API Keys externas.
// 
// El proyecto ahora funciona solo con autenticación local:
// - Registro con email y contraseña
// - Inicio de sesión con email y contraseña
//
// Si en el futuro deseas agregar autenticación social,
// descomenta el código correspondiente y agrega las API Keys en el .env

/*
// EJEMPLO DE CÓDIGO PARA AGREGAR GOOGLE (requiere instalación y API Keys)
// npm install passport-google-oauth20

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ where: { email } });
        
        if (!user) {
            user = await User.create({
                nombres: profile.name?.givenName || 'Usuario',
                apellidos: profile.name?.familyName || 'Google',
                email: email,
                username: `google_${profile.id.substring(0, 15)}`,
                password: Math.random().toString(36).slice(-16),
                fechaNacimiento: '2000-01-01',
                edad: 25,
                authProvider: 'google',
                authProviderId: profile.id,
                isVerified: true
            });
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));
*/

module.exports = passport;