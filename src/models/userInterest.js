const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserInterest = sequelize.define('UserInterest', {
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
    tag: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    tableName: 'user_interests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = UserInterest;