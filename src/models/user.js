const { sequelize } = require('../config/database'); // ✅ correcto
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    // ===== DATOS PERSONALES (Página 7 - Registro) =====
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombres: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' }
        }
    },
    apellidos: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Los apellidos son requeridos' }
        }
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'fecha_nacimiento'
    },
    edad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Email inválido' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    
    // ===== DATOS DE PERFIL (Página 13, 17, 18) =====
    username: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 20],
            is: /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/
        }
    },
    bio: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    fotoPerfil: {
        type: DataTypes.STRING(255),
        defaultValue: '/images/default-avatar.png',
        field: 'foto_perfil'
    },
    fotoPortada: {
        type: DataTypes.STRING(255),
        defaultValue: '/images/default-cover.jpg',
        field: 'foto_portada'
    },
    
    // ===== HOBBIES/INTERESES (Página 17) =====
    hobbies: {
        type: DataTypes.TEXT, // Guardamos como JSON string
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('hobbies');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('hobbies', JSON.stringify(value));
        }
    },
    
    // ===== REDES SOCIALES =====
    instagram: {
        type: DataTypes.STRING(100),
        defaultValue: ''
    },
    twitter: {
        type: DataTypes.STRING(100),
        defaultValue: ''
    },
    tiktok: {
        type: DataTypes.STRING(100),
        defaultValue: ''
    },
    website: {
        type: DataTypes.STRING(255),
        defaultValue: ''
    },
    
    // ===== ESTADÍSTICAS =====
    seguidoresCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'seguidores_count'
    },
    seguidosCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'seguidos_count'
    },
    
    // ===== PARA EXPERTOS =====
    esExperto: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'es_experto'
    },
    especialidades: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('especialidades');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('especialidades', JSON.stringify(value));
        }
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0
    },
    totalResenas: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_resenas'
    },
    
    // ===== CONFIGURACIÓN =====
    configuracion: {
        type: DataTypes.TEXT,
        defaultValue: '{"emailVisible":false,"seguidoresVisible":true,"notificacionesEmail":true,"notificacionesPush":true}',
        get() {
            const raw = this.getDataValue('configuracion');
            return raw ? JSON.parse(raw) : {};
        },
        set(value) {
            this.setDataValue('configuracion', JSON.stringify(value));
        }
    },
    
    // ===== METADATA =====
    role: {
        type: DataTypes.ENUM('user', 'moderator', 'admin'),
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
    },
    lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login'
    },
    
    // ===== AUTENTICACIÓN SOCIAL =====
    authProvider: {
        type: DataTypes.ENUM('local', 'google', 'facebook', 'apple', 'twitter'),
        defaultValue: 'local',
        field: 'auth_provider'
    },
    authProviderId: {
        type: DataTypes.STRING(255),
        defaultValue: null,
        field: 'auth_provider_id'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Método para comparar contraseña
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener nombre completo
User.prototype.nombreCompleto = function() {
    return `${this.nombres} ${this.apellidos}`;
};
// ===== ASOCIACIONES (AGREGAR ESTO) =====
// Importar Post después de definir User para evitar ciclo
/* const Post = require('./Post')

// Un User tiene muchos Posts
User.hasMany(Post, { 
    foreignKey: 'usuarioId', 
    as: 'posts' 
});

// Un User tiene muchos cursos (como experto)
const Course = require('./Course');
User.hasMany(Course, { 
    foreignKey: 'expertoId', 
    as: 'cursos' 
});

// Un User tiene muchas inscripciones
const Enrollment = require('./Enrollment');
User.hasMany(Enrollment, { 
    foreignKey: 'alumnoId', 
    as: 'inscripciones' 
}); */

module.exports = User;