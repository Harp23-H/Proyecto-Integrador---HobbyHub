const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cursoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'curso_id',
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    alumnoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'alumno_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    horarioSeleccionado: {
        type: DataTypes.STRING(100),
        defaultValue: null,
        field: 'horario_seleccionado'
    },
    // Información de pago
    pagoRealizado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'pago_realizado'
    },
    pagoId: {
        type: DataTypes.STRING(100),
        defaultValue: null,
        field: 'pago_id'
    },
    montoPagado: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'monto_pagado'
    },
    metodoPago: {
        type: DataTypes.ENUM('card', 'paypal', 'stripe'),
        defaultValue: null,
        field: 'metodo_pago'
    },
    // Estado de la inscripción
    estado: {
        type: DataTypes.ENUM('pendiente', 'confirmado', 'cancelado', 'completado'),
        defaultValue: 'pendiente'
    },
    fechaInscripcion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'fecha_inscripcion'
    },
    // Comentarios adicionales
    comentarios: {
        type: DataTypes.TEXT,
        defaultValue: null
    }
}, {
    tableName: 'enrollments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Enrollment;