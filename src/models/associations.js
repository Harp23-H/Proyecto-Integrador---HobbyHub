const User = require('./User');
const Post = require('./Post');
const Course = require('./Course');
const Enrollment = require('./Enrollment');

// Asociaciones de User con Post
User.hasMany(Post, { foreignKey: 'usuarioId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

// Asociaciones de User con Course (como experto)
User.hasMany(Course, { foreignKey: 'expertoId', as: 'cursos' });
Course.belongsTo(User, { foreignKey: 'expertoId', as: 'experto' });

// Asociaciones de Enrollment
Enrollment.belongsTo(User, { foreignKey: 'alumnoId', as: 'alumno' });
Enrollment.belongsTo(Course, { foreignKey: 'cursoId', as: 'curso' });
User.hasMany(Enrollment, { foreignKey: 'alumnoId', as: 'inscripciones' });
Course.hasMany(Enrollment, { foreignKey: 'cursoId', as: 'inscripciones' });

console.log('✅ Asociaciones configuradas correctamente');

module.exports = { User, Post, Course, Enrollment };