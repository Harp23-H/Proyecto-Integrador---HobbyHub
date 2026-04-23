const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'hobbyhub',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false, // Desactivar logs de SQL
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL conectado exitosamente');
        
        // Sincronizar modelos sin alter (para no modificar estructura existente)
        // Si necesitas agregar columnas nuevas, hazlo manualmente
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados');
        
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error);
        // No salir del proceso, solo mostrar error
        // process.exit(1);
    }
};

module.exports = { sequelize, connectDB };