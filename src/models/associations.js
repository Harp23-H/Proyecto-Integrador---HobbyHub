const { sequelize } = require('../config/database');

const User = require('./User');
const Post = require('./Post');
const Course = require('./Course');
const Enrollment = require('./Enrollment');

// asociaciones
User.hasMany(Post, { foreignKey: 'usuarioId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

User.hasMany(Course, { foreignKey: 'expertoId', as: 'cursos' });
Course.belongsTo(User, { foreignKey: 'expertoId', as: 'experto' });

Enrollment.belongsTo(User, { foreignKey: 'alumnoId', as: 'alumno' });
Enrollment.belongsTo(Course, { foreignKey: 'cursoId', as: 'curso' });
User.hasMany(Enrollment, { foreignKey: 'alumnoId', as: 'inscripciones' });
Course.hasMany(Enrollment, { foreignKey: 'cursoId', as: 'inscripciones' });

module.exports = { sequelize, User, Post, Course, Enrollment };