const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
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
    }
}, {
    tableName: 'likes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Like;