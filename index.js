const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📂 Rutas disponibles:`);
  console.log(`   • http://localhost:${PORT}/`);
  console.log(`   • http://localhost:${PORT}/auth/login`);
  console.log(`   • http://localhost:${PORT}/auth/register`);
  console.log(`   • http://localhost:${PORT}/feed/explore`);
});
