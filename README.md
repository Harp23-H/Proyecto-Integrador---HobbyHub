# HobbyHub
Repositorio del código fuente del proyecto de clase, Plataforma de Hobbies Nicho.

## Proyecto de Clase: HobbyHub
---
<p align="justify">
HobbyHub es una plataforma web enfocada en hobbies nicho y poco comunes, esos que no encuentras fácilmente en redes generales. Los usuarios descubren y comparten proyectos visuales de hobbies como pintar miniaturas de Warhammer, hacer murales/graffiti, restaurar vinilos, fabricar keycaps mecánicos, cosplay casero, terrarios, etc. La plataforma incluye feed personalizado por tags y la funcionalidad de que usuarios expertos puedan ofrecer cursos/talleres (virtuales o presenciales) o servicios directos, con opción de ser gratis o pagado para monetizar su pasión.</p>

---
#### Consideraciones:

<p align="justify">
El proyecto estará basado en una Arquitectura SOA (Service Oriented Architecture), el Patrón de Diseño MVC (Model, View, Controller) y servicios API REST. Incluirá consumo de APIs de terceros: Autenticación por redes sociales (Google, Facebook, Apple), Google Maps para ubicación de cursos presenciales, y pasarela de pagos (Stripe/PayPal). Deberá gestionarse debidamente en el uso del control de versiones y ramas progresivas del desarrollo del mismo.</p>

### Tabla de Secciones

|No.|Descripción|Potenciador|Estatus|
|---|---|---|---|
|1.| Configuración inicial del Proyecto (NodeJS + Tailwind) | 2 | ✅ Finalizado. |
|2.| Routing, Layouts y Template Engines | 5 | ✅ Finalizado. |
|3.| Creación de páginas de Login y Registro de Usuarios | 6 | Pendiente |
|4.| ORM's, Base de Datos y Modelo de Usuarios | 7 | Pendiente |
|5.| **Autenticación con Redes Sociales** (Google, Facebook, Apple) | 20 | Pendiente |
|6.| **CRUD de Publicaciones** con subida de imágenes (Cloudinary) | 20 | Pendiente |
|7.| **Feed Personalizado** por Tags de Intereses | 15 | Pendiente |
|8.| **Perfiles de Usuario** y Sistema de Búsqueda | 15 | Pendiente |
|9.| **Integración de Google Maps** para ubicación de cursos | 20 | Pendiente |
|10.| **Módulo de Cursos/Talleres** (Creación y gestión) | 20 | Pendiente |
|11.| **Contratación de Cursos** (Presenciales y Virtuales) | 15 | Pendiente |
|12.| **Pasarela de Pagos** (Stripe) y Confirmación | 20 | Pendiente |
|13.| **Dashboard "Mis Contrataciones"** (Alumno/Experto) | 15 | Pendiente |
|14.| **Sistema de Reportes** y Moderación | 10 | Pendiente |
|15.| Publicación del API y Frontend | 5 | Pendiente |

## Pantallas del Proyecto

| # | Pantalla | Descripción |
|---|----------|-------------|
| 1 | Explorar por categoría | Navegación inicial sin login por categorías |
| 2 | Inicio de Sesión | Login con Google, Discord, Apple y Facebook |
| 3 | Registro de Usuario | Creación de cuenta con foto de perfil |
| 4 | Inicio (Usuario logueado) | Feed personalizado con contenido similar |
| 5 | Visualización de publicación | Vista detallada de un proyecto |
| 6 | Subir publicación | Paso 1: Agregar imagen |
| 7 | Descripción de publicación | Paso 2: Agregar descripción |
| 8 | Publicación realizada | Confirmación de posteo exitoso |
| 9 | Visualización de perfil | Perfil de usuario con search bar |
| 10 | Búsqueda de usuarios | Resultados de búsqueda con filtros |
| 11 | Reporte de publicación | Sistema de reportes con niveles |
| 12 | Realización de pago | Pasarela con múltiples opciones de pago |
| 13 | Editar perfil | Gestión de información personal |
| 14 | Perfil personal | Vista de perfil propio con talleres |
| 15 | Contratación (Presencial) | Curso presencial con dirección y detalles |
| 16 | Contratación (Online) | Curso virtual con horarios |

## Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/hobbyhub.git
cd hobbyhub

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev