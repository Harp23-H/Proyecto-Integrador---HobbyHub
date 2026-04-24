const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Quién reporta
    reportadoPor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'reportado_por',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    // Tipo de contenido reportado
    tipoContenido: {
        type: DataTypes.ENUM('publicacion', 'comentario', 'usuario', 'curso'),
        allowNull: false,
        field: 'tipo_contenido'
    },
    // ID del contenido reportado
    contenidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'contenido_id'
    },
    // Motivo del reporte (Página 11)
    motivo: {
        type: DataTypes.ENUM(
            'contenido_inapropiado',
            'spam',
            'acoso',
            'informacion_falsa',
            'discurso_odio',
            'violencia',
            'desnudos',
            'estafa',
            'otro'
        ),
        allowNull: false,
        field: 'motivo'
    },
    // Descripción adicional
    descripcion: {
        type: DataTypes.TEXT,
        defaultValue: null
    },
    // Estado del reporte
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_revision', 'resuelto', 'rechazado'),
        defaultValue: 'pendiente'
    },
    // Moderación
    moderadoPor: {
        type: DataTypes.INTEGER,
        defaultValue: null,
        field: 'moderado_por',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    fechaModeracion: {
        type: DataTypes.DATE,
        defaultValue: null,
        field: 'fecha_moderacion'
    },
    accionTomada: {
        type: DataTypes.TEXT,
        defaultValue: null,
        field: 'accion_tomada'
    },
    // Para trackear si el contenido ya fue ocultado
    contenidoOculto: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'contenido_oculto'
    }
}, {
    tableName: 'reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Report;