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
        field: 'usuario_id'
    },
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
    ubicacionNombre: {
        type: DataTypes.STRING(255),
        defaultValue: null,
        field: 'ubicacion_nombre'
    },
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

module.exports = Post;