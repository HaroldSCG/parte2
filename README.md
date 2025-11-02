# Sistema de Gestión Universitaria – Proyecto (Parte 2)

Aplicación web Node.js + Express con frontend estático y backend conectado a SQL Server (ODBC). Cubre autenticación con reCAPTCHA, gestión de usuarios y módulo de productos/inventario, además de endpoints para un dashboard de métricas.

## Requisitos

- Node.js 18 o superior (fetch nativo y compatibilidad Express 5)
- SQL Server (local o remoto)
- ODBC Driver para SQL Server (recomendado: 17 u 18)
- Herramienta para ejecutar el script SQL inicial (SSMS o sqlcmd)

## Instalación

1) Clonar el repositorio y entrar al directorio del proyecto
2) Instalar dependencias

```
npm install
```

3) Configurar variables de entorno creando un archivo `.env` en la raíz

Variables esperadas:

```
# Servidor web
PORT=3000

# SQL Server / ODBC
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=DB_parte2
DB_USER=             # si se omite, usa Trusted_Connection
DB_PASSWORD=
ODBC_DRIVER=ODBC Driver 17 for SQL Server
DB_ENCRYPT=No        # Yes/No
DB_TRUST_CERT=Yes    # Yes/No

# reCAPTCHA (clave secreta)
# Para pruebas puedes usar la clave de test de Google:
# 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
RECAPTCHA_SECRET_KEY=

# Brevo (Sendinblue) – Email para contraseña temporal
BREVO_API_KEY=
BREVO_USER=
BREVO_PASS=
```

4) Preparar la base de datos

- Ejecuta `database/DB_pt2.sql` en tu SQL Server para crear el esquema `seg` y los SPs del módulo de usuarios/seguridad.
- Importante: el backend también usa tablas fuera de ese script. Debes tener creada (o agregar scripts para):
  - `inv.productos` (usada por el módulo de productos)

5) Iniciar la aplicación

```
npm start
```

La app sirve el frontend en `http://localhost:3000/` (página de login) y los recursos estáticos desde `public/`.

## Estructura del Proyecto (parcial)

- `server.js` – Servidor Express, configuración DB/ODBC, rutas principales y endpoints (login, dashboard, usuarios y productos)
- `src/`
  - `routes/productos.routes.js` – Rutas de productos (modular)
  - `controllers/productos.controller.js` – Controlador de productos
  - `services/productos.service.js` – Acceso a datos de productos (inv.productos)
  - `middlewares/recaptcha.js` – Verificación de reCAPTCHA en `/api/login`
  - `services/email.service.js` – Envío híbrido (Brevo API + SMTP) para contraseñas temporales
- `public/`
  - `index.html` – Login con reCAPTCHA (clave pública de test)
  - `dashboard.html` – Vista de dashboard
  - `js/` – Lógica de UI (login, dashboard, configuración)
- `database/DB_pt2.sql` – Script SQL (esquema `seg`, usuarios y SPs)

## Endpoints Principales (REST)

- Autenticación y dashboard
  - `POST /api/login` – Login con reCAPTCHA (SP `seg.sp_ValidarUsuario`)
  - `GET  /api/dashboard-stats` – Métricas del dashboard



- Usuarios
  - `GET    /api/usuarios` – Listar usuarios
  - `GET    /api/usuarios/:id` – Detalle usuario
  - `POST   /api/usuarios` – Crear usuario (usa `seg.sp_RegistrarUsuario`)
  - `POST   /api/usuarios/:id/reset-password` – Genera contraseña temporal y envía correo
  - `POST   /api/usuarios/:id/disable` – Deshabilitar (lógico)
  - `POST   /api/usuarios/:id/enable` – Rehabilitar

- Productos (inv.productos)
  - `POST /api/productos` – Crear producto
  - `GET  /api/productos` – Listar con filtros y paginación

Nota: Las rutas de productos se sirven únicamente desde `src/routes/productos.routes.js` (se removieron duplicados en `server.js`).

## reCAPTCHA de Prueba

- El frontend usa la clave pública de prueba de Google (v2) en `public/index.html`.
- Configura `RECAPTCHA_SECRET_KEY` en el servidor. Para pruebas locales, puedes usar la clave secreta de test.

## Correo (Brevo)

- `BREVO_API_KEY` permite enviar vía API. Si falla, se intenta por SMTP con `BREVO_USER` y `BREVO_PASS`.
- Configura estas credenciales en `.env`. No uses valores hardcodeados en producción.

## Solución de Problemas

- ODBC/Conexión: verifica el nombre exacto del driver y el `DB_SERVER` (por ejemplo `localhost\SQLEXPRESS`). En entornos con TLS, ajusta `DB_ENCRYPT` y `DB_TRUST_CERT`.
- Node.js: usa versión 18+ para disponer de `fetch` nativo y compatibilidad con dependencias actuales.
- reCAPTCHA: si recibes error de verificación, confirma `RECAPTCHA_SECRET_KEY` y que el token del cliente se envía como `captchaToken`.
- Email: sin llaves válidas de Brevo, el envío fallará. Revisa logs del servidor y credenciales.
- Duplicidad de rutas de productos: unifica el manejo en el router modular para evitar comportamientos inesperados.
- Script faltante: agrega scripts para `inv.productos` si no existe en tu BD.

## Scripts npm

- `npm start` – Inicia el servidor (`server.js`)
- `npm run dev` – Igual que start
- `npm test` – Intenta ejecutar `test-connection.js` (no incluido). Puedes crear uno para validar la conexión ODBC.

## Notas

- No incluir credenciales reales en el repositorio. Usa `.env` y, si lo deseas, agrega un `.env.example` (pendiente).
- El archivo `requerimientos.txt` documenta los requerimientos de reportes del curso. Muchas vistas de dashboard muestran datos de ejemplo en el frontend; puedes conectar reportes reales a SPs/vistas según esos requisitos.

---
¿Quieres que agregue un `.env.example` y deje solo el router modular de productos? También puedo crear un `test-connection.js` para verificar la conexión a SQL Server rápidamente.
