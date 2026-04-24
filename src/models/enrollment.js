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
        type: DataTypes.ENUM('pendiente', 'confirmado', 'en_progreso', 'completado', 'cancelado'),
        defaultValue: 'pendiente'
    },
    // Progreso del alumno
    progreso: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Porcentaje de progreso (0-100)'
    },
    calificacion: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: null,
        validate: { min: 0, max: 5 }
    },
    // Fechas importantes
    fechaInscripcion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'fecha_inscripcion'
    },
    fechaInicio: {
        type: DataTypes.DATE,
        defaultValue: null,
        field: 'fecha_inicio'
    },
    fechaCompletado: {
        type: DataTypes.DATE,
        defaultValue: null,
        field: 'fecha_completado'
    },
    // Comentarios y feedback
    comentarios: {
        type: DataTypes.TEXT,
        defaultValue: null
    },
    feedbackExperto: {
        type: DataTypes.TEXT,
        defaultValue: null,
        field: 'feedback_experto'
    },
    // Certificado
    certificadoUrl: {
        type: DataTypes.STRING(500),
        defaultValue: null,
        field: 'certificado_url'
    }
}, {
    tableName: 'enrollments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Asociaciones
Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.Course, { foreignKey: 'cursoId', as: 'curso' });
    Enrollment.belongsTo(models.User, { foreignKey: 'alumnoId', as: 'alumno' });
};

module.exports = Enrollment;