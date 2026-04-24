# HobbyHub
Repositorio del código fuente del proyecto de clase, Plataforma de Hobbies Nicho.

## Proyecto de Clase: HobbyHub
---
## ¿Qué es HobbyHub?
<p align="justify">
HobbyHub es una plataforma web enfocada en hobbies nicho y poco comunes, esos que no encuentras fácilmente en redes generales. Los usuarios descubren y comparten proyectos visuales de hobbies como pintar miniaturas de Warhammer, hacer murales/graffiti, restaurar vinilos, fabricar keycaps mecánicos, cosplay casero, terrarios, etc. La plataforma incluye feed personalizado por tags y la funcionalidad de que usuarios expertos puedan ofrecer cursos/talleres (virtuales o presenciales) o servicios directos, con opción de ser gratis o pagado para monetizar su pasión.</p>

---
## Logotipos
| Logo de la Aplicación | Logo del Equipo |
|----------------------|----------------|
| ![Logo App](/Imagenes/logoHobbyHub.png)) | ![Logo Equipo](/Imagenes/LogoEmpresa.png) |

---

##  Equipo de trabajo

![Organigrama](/Imagenes/OrganigramaEquipo.png)

---

##  Planeación del proyecto

![Organigrama](/Imagenes/gant.jpeg)

---
#### Consideraciones:

<p align="justify">
El proyecto estará basado en una Arquitectura SOA (Service Oriented Architecture), el Patrón de Diseño MVC (Model, View, Controller) y servicios API REST. Incluirá consumo de APIs de terceros: Autenticación por redes sociales (Google, Facebook, Apple), Google Maps para ubicación de cursos presenciales, y pasarela de pagos (Stripe/PayPal). Deberá gestionarse debidamente en el uso del control de versiones y ramas progresivas del desarrollo del mismo.</p>

### Tabla de Secciones

|No.|Descripción|Potenciador|Estatus|
|---|---|---|---|
|1.| Configuración inicial del Proyecto (NodeJS + Tailwind) | 2 | ✅ Finalizado. |
|2.| Routing, Layouts y Template Engines | 5 | ✅ Finalizado. |
|3.| Creación de páginas de Login y Registro de Usuarios | 6 | ✅ Finalizado. |
|4.| ORM's, Base de Datos y Modelo de Usuarios | 7 | ✅ Finalizado |
|5.| **Autenticación con Redes Sociales** (Google, Facebook, Apple) | 20 | ✅ Finalizado |
|6.| **CRUD de Publicaciones** con subida de imágenes (Cloudinary) | 20 | ✅ Finalizado |
|7.| **Feed Personalizado** por Tags de Intereses | 15 | ✅ Finalizado |
|8.| **Perfiles de Usuario** y Sistema de Búsqueda | 15 | ✅ Finalizado |
|9.| **Integración de Google Maps** para ubicación de cursos | 20 | ✅ Finalizado |
|10.| **Módulo de Cursos/Talleres** (Creación y gestión) | 20 | ✅ Finalizado |
|11.| **Contratación de Cursos** (Presenciales y Virtuales) | 15 | ✅ Finalizado |
|12.| **Pasarela de Pagos** (Stripe) y Confirmación | 20 | ✅ Finalizado |
|13.| **Dashboard "Mis Contrataciones"** (Alumno/Experto) | 15 | ✅ Finalizado |
|14.| **Sistema de Reportes** y Moderación | 10 | ✅ Finalizado |
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

---
##  Descripción del problema

En la actualidad, muchas personas tienen interés en aprender nuevas habilidades o desarrollar hobbies, sin embargo, no siempre cuentan con un espacio digital adecuado donde puedan hacerlo de manera organizada, accesible y confiable. Aunque existen diversas plataformas en internet, la mayoría se enfoca únicamente en el entretenimiento o en la educación, pero rara vez combinan ambas funciones de manera eficiente. Esto provoca que los usuarios tengan que utilizar múltiples aplicaciones para satisfacer sus necesidades, lo que resulta poco práctico y limita la interacción entre personas con intereses similares.
A partir de esta problemática surge la necesidad de crear una solución que integre comunidad, aprendizaje y difusión de contenido en un solo entorno. HobbyHub nace como una propuesta que busca cubrir esta necesidad, ofreciendo un espacio donde los usuarios puedan compartir sus conocimientos, aprender nuevas actividades y conectar con otros usuarios. 

---

##  Objetivo general

Desarrollar una plataforma web interactiva que permita a los usuarios compartir, descubrir y ofrecer talleres relacionados con distintos hobbies. Se busca que la aplicación funcione como un entorno digital completo donde los usuarios puedan tanto consumir contenido como generarlo, promoviendo así la participación activa dentro de la plataforma. Este enfoque permite que el aprendizaje no sea un proceso pasivo, sino una experiencia compartida entre los miembros de la comunidad.

---

##  Objetivos específicos

- Implementar registro e inicio de sesión  
- Desarrollar publicación de contenido  
- Permitir interacción entre usuarios  
- Validar el sistema mediante pruebas  
- Evaluar la calidad usando KPIs  

---

## Requerimientos del sistema

###  Funcionales
- Registro de usuarios  
- Inicio de sesión  
- Publicación de contenido  
- Visualización de hobbies  
- Edición de perfil  

###  No funcionales
- Seguridad en autenticación  
- Buen rendimiento  
- Interfaz amigable  
- Disponibilidad del sistema  

###  Reglas de negocio
- No permitir campos vacíos  
- Validar credenciales  
- Controlar acceso a funcionalidades  

---

##  Tecnologías utilizadas

- Frontend: HTML, CSS, JavaScript  
- Backend: Node.js, Express  
- Base de datos: MySQL  
- Testing: JIRA  
- Control de versiones: GitHub  

---

##  Pruebas del sistema

Para validar el funcionamiento de HobbyHub se realizaron pruebas mediante **JIRA**, evaluando:

- Registro de usuario  
- Inicio de sesión  
- Publicación de contenido  
- Visualización del feed  
- Edición de perfil  

---

##  Resultados obtenidos

- Casos de prueba: 10  
- Correctos: 6  
- Con errores: 4  

---

##  KPIs

| Indicador | Resultado |
|----------|--------|
| Cobertura | 100% |
| Tasa de defectos | 40% |
| Productividad | 2 casos/hora |

---

##  Problemas detectados

Durante las pruebas se identificaron:

- Validación de campos incompleta  
- Errores en el feed  
- Problemas al publicar contenido  

---

##  Acciones correctivas

- Mejorar validaciones  
- Corregir lógica del sistema  
- Optimizar manejo de errores  

---

##  Propuestas de mejora

- Sistema de recomendaciones  
- Notificaciones  
- Mejor diseño visual  
- Optimización de rendimiento  

---

##  Conclusión

HobbyHub funciona en la mayoría de sus funciones, pero presenta algunos errores importantes que deben corregirse antes de su implementación en producción.

A pesar de esto, el sistema tiene una base sólida y un gran potencial de crecimiento.

---

##  Uso de IA

Se utilizaron herramientas de IA como apoyo en:
- Corrección de redacción de documentación  
- Organización del proyecto  
- Mejora de ideas  

Siempre revisando y adaptando el contenido. 

---

## Integrantes

- Blanca Sarahí Meléndez Torres-240755  
- Vanessa Vergara Domínguez-240270
- Marianna Mayte Gutiérrez Gayosso-240174
- Harold Alexis Ramírez Peralta-240497
- José Antonio Ricaño Reyes-240267

---

##  Estado del proyecto

🟡 En desarrollo (aún no listo para producción...)