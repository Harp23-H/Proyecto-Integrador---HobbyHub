const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
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
    titulo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imagenUrl: {
        type: DataTypes.STRING(500),
        defaultValue: '/images/default-course.jpg',
        field: 'imagen_url'
    },
    modalidad: {
        type: DataTypes.ENUM('online', 'presencial'),
        allowNull: false
    },
    // Campos para ONLINE
    plataforma: {
        type: DataTypes.STRING(50),
        defaultValue: null
    },
    horarios: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('horarios');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('horarios', JSON.stringify(value));
        }
    },
    // Campos para PRESENCIAL
    direccion: {
        type: DataTypes.TEXT,
        defaultValue: null
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
    horarioGeneral: {
        type: DataTypes.TEXT,
        defaultValue: null,
        field: 'horario_general'
    },
    requisitos: {
        type: DataTypes.TEXT,
        defaultValue: null
    },
    // Campos comunes
    materiales: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('materiales');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('materiales', JSON.stringify(value));
        }
    },
    modulos: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
            const raw = this.getDataValue('modulos');
            return raw ? JSON.parse(raw) : [];
        },
        set(value) {
            this.setDataValue('modulos', JSON.stringify(value));
        }
    },
    nivel: {
        type: DataTypes.ENUM('Principiante', 'Intermedio', 'Avanzado'),
        defaultValue: 'Principiante'
    },
    duracion: {
        type: DataTypes.DECIMAL(5, 1),
        defaultValue: 0
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    estudiantesInscritos: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'estudiantes_inscritos'
    }
}, {
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Course;