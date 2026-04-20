const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la conexión
const sequelize = new Sequelize(
    process.env.DB_NAME || 'hobbyhub',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log, // Muestra las consultas SQL en consola
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Probar conexión
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL conectado exitosamente');
        
        // Sincronizar modelos (crear tablas si no existen)
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados');
        
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };