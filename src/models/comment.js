const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id'
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'usuario_id'
    },
    texto: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Comment;