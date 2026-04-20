const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'usuario_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Imagen de Cloudinary
    imagenUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'imagen_url'
    },
    imagenPublicId: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'imagen_public_id'
    },
    // Descripción y etiquetas (Página 11)
    descripcion: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    etiquetas: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('etiquetas');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('etiquetas', JSON.stringify(value));
        }
    },
    // Ubicación (Página 11)
    ubicacionNombre: {
        type: DataTypes.STRING(255),
        defaultValue: null,
        field: 'ubicacion_nombre'
    },
    ubicacionLat: {
        type: DataTypes.DECIMAL(10, 8),
        defaultValue: null,
        field: 'ubicacion_lat'
    },
    ubicacionLng: {
        type: DataTypes.DECIMAL(11, 8),
        defaultValue: null,
        field: 'ubicacion_lng'
    },
    // Audio (opcional)
    audioUrl: {
        type: DataTypes.STRING(500),
        defaultValue: null,
        field: 'audio_url'
    },
    // Estadísticas
    likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'likes_count'
    },
    comentariosCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'comentarios_count'
    },
    // Estado
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Relación con User (después de definir ambos modelos)
Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: 'usuarioId', as: 'usuario' });
    Post.hasMany(models.Like, { foreignKey: 'postId', as: 'likes' });
    Post.hasMany(models.Comentario, { foreignKey: 'postId', as: 'comentarios' });
};

module.exports = Post;