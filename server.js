const nodemailer = require('nodemailer');
const crypto = require('crypto'); 
const rateLimit = require('express-rate-limit');
const { verifyRecaptcha } = require('./src/middlewares/recaptcha');

const { sendBrevoEmail } = require('./src/services/email.service');



const express = require('express');
const sql = require('mssql/msnodesqlv8');
const path = require('path');
require('dotenv').config();





const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// Configuración de conexión a SQL Server desde .env
const dbServer = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
const dbName = process.env.DB_DATABASE || 'AcademicoDB';
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const odbcDriver = process.env.ODBC_DRIVER || 'ODBC Driver 18 for SQL Server';
const encrypt = process.env.DB_ENCRYPT || 'no';
const trustCert = process.env.DB_TRUST_CERT || 'yes';
const useTrusted = !dbUser || !dbPass;

const connectionString = `Driver={${odbcDriver}};Server=${dbServer};Database=${dbName};` +
  (useTrusted ? 'Trusted_Connection=Yes;' : `Trusted_Connection=No;Uid=${dbUser};Pwd=${dbPass};`) +
  `Encrypt=${encrypt};TrustServerCertificate=${trustCert};`;

const dbConfig = {
  connectionString
};


let pool;
//LOGIN
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Montar routers modulares de comercio
try {
  const productosRouter = require('./src/routes/productos.routes');
  const categoriasRouter = require('./src/routes/categorias.routes');
  const inventarioRouter = require('./src/routes/inventario.routes');
  const ventasRouter = require('./src/routes/ventas.routes');
  const reportesRouter = require('./src/routes/reportes.routes');

  app.use('/api/productos', productosRouter);
  app.use('/api/categorias', categoriasRouter);
  app.use('/api/inventario', inventarioRouter);
  app.use('/api/ventas', ventasRouter);
  app.use('/api/reportes', reportesRouter);
} catch (e) {
  console.error('No se pudo montar routers de comercio:', e && e.message ? e.message : e);
}

app.post('/api/login', verifyRecaptcha, async (req, res) => {
  try {
    const { usuario, password } = req.body;

    console.log('🔐 Login attempt for user:', usuario);

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña requeridos'
      });
    }

    if (!pool) {
      pool = await sql.connect(dbConfig);
    }

    const request = pool.request();
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('Password', sql.NVarChar(200), password);

    const result = await request.execute('seg.sp_ValidarUsuario');

    if (result.recordset && result.recordset.length > 0) {
      const userData = result.recordset[0];

      if (userData.Resultado === 'OK') {
        console.log('✅ Login successful for:', userData.Usuario, '- Role:', userData.Rol);
        return res.json({
          success: true,
          message: userData.Mensaje,
          user: {
            id: userData.IdUsuario,
            usuario: userData.Usuario,
            nombres: userData.Nombres,
            apellidos: userData.Apellidos,
            rol: userData.Rol,
            correo: userData.Correo,
            esPasswordTemporal: userData.EsPasswordTemporal
          }
        });
      } else {
        console.log('❌ Login failed for:', usuario, '- Reason:', userData.Mensaje);
        return res.status(401).json({ success: false, message: userData.Mensaje });
      }
    }

    return res.status(401).json({ success: false, message: 'Error en la consulta' });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Ruta para obtener estadísticas del dashboard
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas del dashboard...');

        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        const [usuariosTotal, usuariosActivos, accesosOKHoy, accesosFailHoy, ultimosAccesos] = await Promise.all([
            pool.request().query('SELECT COUNT(*) AS total FROM seg.tbUsuario'),
            pool.request().query('SELECT COUNT(*) AS activos FROM seg.tbUsuario WHERE Estado = 1'),
            pool.request().query(`
                SELECT COUNT(*) AS accesos
                FROM seg.tbBitacoraAcceso
                WHERE CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
                  AND Resultado = 'OK'`),
            pool.request().query(`
                SELECT COUNT(*) AS fallidos
                FROM seg.tbBitacoraAcceso
                WHERE CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
                  AND Resultado = 'FAIL'`),
            pool.request().query(`
                SELECT TOP 5 Usuario, FechaHora, Resultado
                FROM seg.tbBitacoraAcceso
                ORDER BY FechaHora DESC`)
        ]);

        const stats = {
            admin: {
                usuariosTotal: usuariosTotal.recordset[0].total,
                usuariosActivos: usuariosActivos.recordset[0].activos,
                accesosHoy: accesosOKHoy.recordset[0].accesos,
                accesosFallidosHoy: accesosFailHoy.recordset[0].fallidos,
                ultimosAccesos: ultimosAccesos.recordset
            },
            secretaria: {
                usuariosActivos: usuariosActivos.recordset[0].activos,
                accesosHoy: accesosOKHoy.recordset[0].accesos
            }
        };

        console.log('✅ Estadísticas obtenidas:', stats);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error obteniendo estadísticas del dashboard' });
    }
});






// Ruta para crear usuarios con contraseña temporal
app.post('/api/usuarios', async (req, res) => {
    try {
        const { usuarioEjecutor, nombres, apellido, email, rol, password } = req.body;

        console.log('👤 Creando nuevo usuario:');
        console.log('📋 Datos recibidos:', { usuarioEjecutor, nombres, apellido, email, rol, hasPassword: !!password });
        console.log('📋 Body completo:', req.body);

        // Validar datos de entrada
        if (!usuarioEjecutor || !nombres || !apellido || !email || !rol || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }

        // Validar rol válido
        if (!['admin', 'secretaria'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Debe ser admin o secretaria'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // Generar nombre de usuario automáticamente
        const usuario = (nombres.substring(0, 3) + apellido.substring(0, 3)).toLowerCase().replace(/\s/g, '');

        // Usar el SP disponible en DB_pt2.sql (sp_RegistrarUsuario)
        const request = pool.request();
        request.input('Usuario', sql.VarChar(50), usuario);
        request.input('Nombres', sql.VarChar(100), nombres);
        request.input('Apellidos', sql.VarChar(100), apellido);
        request.input('Correo', sql.VarChar(120), email);
        request.input('Rol', sql.VarChar(20), rol);
        request.input('Password', sql.NVarChar(200), password);
        request.input('Confirmar', sql.NVarChar(200), password);
        request.output('Mensaje', sql.NVarChar(200));

        const result = await request.execute('seg.sp_RegistrarUsuario');

        console.log('📋 Resultado alta usuario:', { returnValue: result.returnValue, mensaje: result.output.Mensaje });

        if (result.returnValue === 0) {
            // Marcar contraseña como temporal (24h) para forzar cambio en primer login
            const fechaExpira = new Date();
            fechaExpira.setHours(fechaExpira.getHours() + 24);

            await pool.request()
                .input('Usuario', sql.VarChar(50), usuario)
                .input('FechaExpira', sql.DateTime2, fechaExpira)
                .query(`
                    UPDATE seg.tbUsuario
                    SET EsPasswordTemporal = 1,
                        FechaExpiraPassword = @FechaExpira
                    WHERE Usuario = @Usuario
                `);

            // Éxito
            res.json({
                success: true,
                message: result.output.Mensaje,
                usuario: {
                    usuario: usuario,
                    nombres: nombres,
                    apellidos: apellido,
                    correo: email,
                    rol: rol,
                    esPasswordTemporal: true
                }
            });
        } else {
            // Error desde el procedimiento
            res.status(400).json({
                success: false,
                message: result.output.Mensaje || 'Error al crear el usuario'
            });
        }

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        console.error('❌ Stack trace:', error.stack);
        console.error('❌ Detalles completos del error:', {
            message: error.message,
            name: error.name,
            code: error.code,
            number: error.number,
            severity: error.severity,
            state: error.state,
            procedure: error.procedure,
            lineNumber: error.lineNumber
        });
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
});

// Ruta para cambiar contraseña (soporta nombres de SP antiguos y nuevos)
app.post('/api/usuarios/cambiar-password', async (req, res) => {
    try {
        const { usuario, passwordActual, passwordNueva, confirmarPassword } = req.body;

        console.log('🔑 Cambiando contraseña para:', usuario);

        // Validar datos de entrada
        if (!usuario || !passwordActual || !passwordNueva || !confirmarPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // Construir request base (parámetros coinciden con ambos SPs)
        const makeRequest = () => {
            const r = pool.request();
            r.input('Usuario', sql.VarChar(50), usuario);
            r.input('PasswordActual', sql.NVarChar(200), passwordActual);
            r.input('PasswordNueva', sql.NVarChar(200), passwordNueva);
            r.input('ConfirmarNueva', sql.NVarChar(200), confirmarPassword);
            r.output('Mensaje', sql.NVarChar(200));
            return r;
        };

        let result;
        try {
            // Preferir el SP del script actual (DB_pt2.sql)
            result = await makeRequest().execute('seg.sp_ActualizarContrasena');
        } catch (err) {
            // Si el SP no existe (p.ej. DB antigua), intentar el nombre previo
            const notFound = (err && (err.number === 2812 || /could not find stored procedure|no se pudo encontrar el procedimiento almacenado/i.test(String(err.message))));
            if (!notFound) throw err;
            result = await makeRequest().execute('seg.sp_CambiarPasswordTemporal');
        }

        console.log('📋 Resultado cambio contraseña:', {
            returnValue: result.returnValue,
            mensaje: result.output.Mensaje
        });

        if (result.returnValue === 0) {
            return res.json({ success: true, message: result.output.Mensaje });
        }

        return res.status(400).json({
            success: false,
            message: result.output.Mensaje || 'Error al cambiar la contraseña'
        });

    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// === PRODUCTOS ===
// Rutas manejadas exclusivamente en './src/routes/productos.routes.js'

// Ruta para obtener usuarios reales de la base de datos
app.get('/api/usuarios', async (req, res) => {
    try {
        console.log('📋 Solicitando lista de usuarios de la BD...');

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // Consulta para obtener usuarios (ACTIVOS e INACTIVOS, no eliminados físicamente)
        const result = await pool.request().query(`
            SELECT
                u.IdUsuario,
                u.Usuario,
                u.Nombres + ' ' + u.Apellidos AS NombreCompleto,
                u.Correo,
                u.Rol,
                u.Estado,
                u.FechaCreacion,
                (
                    SELECT TOP 1 ba.FechaHora
                    FROM seg.tbBitacoraAcceso ba
                    WHERE ba.IdUsuario = u.IdUsuario
                      AND ba.Resultado = 'OK'
                    ORDER BY ba.FechaHora DESC
                ) AS UltimoAcceso
            FROM seg.tbUsuario u
            ORDER BY u.FechaCreacion DESC
        `);

        console.log(`✅ Encontrados ${result.recordset.length} usuarios en la BD`);

        // Formatear datos para el frontend
        const usuarios = result.recordset.map(user => ({
            id: user.IdUsuario,
            usuario: user.Usuario,
            nombreCompleto: user.NombreCompleto,
            email: user.Correo,
            rol: user.Rol,
            estado: user.Estado ? 'Activo' : 'Inactivo',
            ultimoAcceso: user.UltimoAcceso ?
                new Date(user.UltimoAcceso).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : 'Nunca',
            fechaCreacion: new Date(user.FechaCreacion).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        }));

        res.json({
            success: true,
            usuarios: usuarios,
            total: usuarios.length
        });

    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            usuarios: [],
            total: 0
        });
    }
});

// Ruta para obtener un usuario específico por ID
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        console.log(`📋 Obteniendo usuario ID: ${userId}`);

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // Consulta para obtener usuario específico con su último acceso
        const result = await pool.request()
            .input('UserId', sql.Int, userId)
            .query(`
                SELECT
                    u.IdUsuario,
                    u.Usuario,
                    u.Nombres,
                    u.Apellidos,
                    u.Nombres + ' ' + u.Apellidos AS NombreCompleto,
                    u.Correo,
                    u.Rol,
                    u.Estado,
                    u.FechaCreacion,
                    u.UltimoCambioPass,
                    (
                        SELECT TOP 1 ba.FechaHora
                        FROM seg.tbBitacoraAcceso ba
                        WHERE ba.IdUsuario = u.IdUsuario
                          AND ba.Resultado = 'OK'
                        ORDER BY ba.FechaHora DESC
                    ) AS UltimoAcceso
                FROM seg.tbUsuario u
                WHERE u.IdUsuario = @UserId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = result.recordset[0];

        // Formatear datos para el frontend
        const userData = {
            id: user.IdUsuario,
            usuario: user.Usuario,
            nombres: user.Nombres,
            apellidos: user.Apellidos,
            nombreCompleto: user.NombreCompleto,
            email: user.Correo,
            rol: user.Rol,
            estado: user.Estado ? 'Activo' : 'Inactivo',
            ultimoAcceso: user.UltimoAcceso ?
                new Date(user.UltimoAcceso).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : 'Nunca',
            fechaCreacion: new Date(user.FechaCreacion).toLocaleString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }),
            ultimoCambioPass: user.UltimoCambioPass ?
                new Date(user.UltimoCambioPass).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Nunca'
        };

        console.log(`✅ Usuario ${userId} encontrado: ${userData.nombreCompleto}`);

        res.json({
            success: true,
            usuario: userData
        });

    } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para eliminar usuario (DELETE) - eliminación definitiva (solo admin)
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { usuarioEjecutor } = req.body;

        console.log('🗑️ Eliminando usuario:', { userId, usuarioEjecutor });

        // Validar datos de entrada
        if (!usuarioEjecutor) {
            return res.status(400).json({
                success: false,
                message: 'Usuario ejecutor es requerido'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // 1) Verificar que el ejecutor sea admin activo
        const execCheck = await pool.request()
            .input('Usuario', sql.VarChar(50), usuarioEjecutor)
            .query("SELECT Rol, Estado FROM seg.tbUsuario WHERE Usuario=@Usuario");
        const exec = execCheck.recordset[0];
        if (!exec || exec.Rol !== 'admin' || !(exec.Estado === true || exec.Estado === 1)) {
            return res.status(403).json({ success: false, message: 'Solo un administrador activo puede eliminar usuarios' });
        }

        // 2) Obtener datos del usuario a eliminar para bitácora
        const userQ = await pool.request()
            .input('IdUsuario', sql.Int, userId)
            .query('SELECT Usuario, Nombres, Apellidos FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario');
        if (userQ.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        const toDelete = userQ.recordset[0];

        // 3) Eliminación definitiva
        await pool.request()
            .input('IdUsuario', sql.Int, userId)
            .query('DELETE FROM seg.tbUsuario WHERE IdUsuario=@IdUsuario');

        // 4) Bitácora
        await pool.request()
            .input('Usuario', sql.VarChar(50), usuarioEjecutor)
            .input('IdUsuario', sql.Int, userId)
            .input('Operacion', sql.VarChar(30), 'DELETE_USER')
            .input('Entidad', sql.VarChar(30), 'tbUsuario')
            .input('Clave', sql.VarChar(100), `IdUsuario=${userId}`)
            .input('Detalle', sql.NVarChar(4000), `Eliminación definitiva de usuario ${toDelete.Usuario} (${toDelete.Nombres} ${toDelete.Apellidos})`)
            .query(`
                INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
                VALUES(@Usuario, (SELECT IdUsuario FROM seg.tbUsuario WHERE Usuario=@Usuario), @Operacion, @Entidad, @Clave, @Detalle)
            `);

        res.json({ success: true, message: 'Usuario eliminado definitivamente' });

    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para actualizar usuario (PUT) - usa UPDATE directo en DB_pt2.sql
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const {
            usuarioEjecutor,
            nombres,
            apellido,
            email,
            rol,
            estado
        } = req.body;

        console.log('📝 Actualizando usuario:', { userId, usuarioEjecutor, nombres, apellido, email, rol, estado });

        // Validar datos de entrada
        if (!usuarioEjecutor || !nombres || !apellido || !email || !rol || estado === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // Obtener el nombre de usuario actual para pasarlo al SP
        const userQuery = await pool.request()
            .input('UserId', sql.Int, userId)
            .query('SELECT Usuario FROM seg.tbUsuario WHERE IdUsuario = @UserId');

        if (userQuery.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const currentUsuario = userQuery.recordset[0].Usuario;

        // Validar duplicados de correo para otro usuario
        const emailDup = await pool.request()
            .input('Correo', sql.VarChar(120), email)
            .input('IdUsuario', sql.Int, userId)
            .query('SELECT COUNT(*) AS cnt FROM seg.tbUsuario WHERE Correo=@Correo AND IdUsuario<>@IdUsuario');
        if (emailDup.recordset[0].cnt > 0) {
            return res.status(400).json({ success: false, message: 'Correo ya utilizado por otro usuario' });
        }

        // Actualizar
        await pool.request()
            .input('IdUsuario', sql.Int, userId)
            .input('Nombres', sql.VarChar(100), nombres)
            .input('Apellidos', sql.VarChar(100), apellido)
            .input('Correo', sql.VarChar(120), email)
            .input('Rol', sql.VarChar(20), rol)
            .input('Estado', sql.Bit, estado === 'activo' ? 1 : 0)
            .query(`
                UPDATE seg.tbUsuario
                SET Nombres=@Nombres, Apellidos=@Apellidos, Correo=@Correo, Rol=@Rol, Estado=@Estado
                WHERE IdUsuario=@IdUsuario
            `);

        // Bitácora
        await pool.request()
            .input('Usuario', sql.VarChar(50), usuarioEjecutor)
            .input('IdUsuario', sql.Int, userId)
            .input('Operacion', sql.VarChar(30), 'UPDATE_USER')
            .input('Entidad', sql.VarChar(30), 'tbUsuario')
            .input('Clave', sql.VarChar(100), `IdUsuario=${userId}`)
            .input('Detalle', sql.NVarChar(4000), `Actualización de usuario (${currentUsuario})`)
            .query(`
                INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
                VALUES(@Usuario, (SELECT IdUsuario FROM seg.tbUsuario WHERE Usuario=@Usuario), @Operacion, @Entidad, @Clave, @Detalle)
            `);

        res.json({ success: true, message: 'Usuario actualizado' });

    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para resetear contraseña de usuario
app.post('/api/usuarios/:id/reset-password', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { usuarioEjecutor, newPassword } = req.body;

        console.log('🔑 Reseteando contraseña para usuario:', userId);

        // Validar datos de entrada
        if (!usuarioEjecutor || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Usuario ejecutor y nueva contraseña son requeridos'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        // Obtener datos del usuario a resetear
        const userQuery = await pool.request()
            .input('UserId', sql.Int, userId)
            .query('SELECT Usuario, Correo, Nombres, Apellidos FROM seg.tbUsuario WHERE IdUsuario = @UserId AND Estado = 1');

        if (userQuery.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        const targetUser = userQuery.recordset[0];

        // Generar salt aleatorio (16 bytes)
        const salt = require('crypto').randomBytes(16);

        // Calcular fecha de expiración (24 horas desde ahora)
        const fechaExpira = new Date();
        fechaExpira.setHours(fechaExpira.getHours() + 24);

        // Actualizar contraseña usando la función de SQL Server para consistencia
       
        const updateResult = await pool.request()
            .input('UserId', sql.Int, userId)
            .input('Password', sql.NVarChar(200), newPassword)
            .input('Salt', sql.VarBinary(16), salt)
            .input('FechaExpira', sql.DateTime2, fechaExpira)
            .query(`
                UPDATE seg.tbUsuario
                SET
                    HashPassword = seg.fn_HashWithSalt(@Password, @Salt),
                    Salt = @Salt,
                    UltimoCambioPass = SYSDATETIME(),
                    EsPasswordTemporal = 1,
                    FechaExpiraPassword = @FechaExpira
                WHERE IdUsuario = @UserId
            `);

        // Registrar en bitácora
        const fechaExpiraFormatted = fechaExpira.toLocaleString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        await pool.request()
            .input('Usuario', sql.VarChar(50), usuarioEjecutor)
            .input('IdUsuario', sql.Int, userId)
            .input('Operacion', sql.VarChar(30), 'RESET_PASSWORD_TEMPORAL')
            .input('Entidad', sql.VarChar(30), 'tbUsuario')
            .input('Clave', sql.VarChar(100), `IdUsuario=${userId}`)
            .input('Detalle', sql.NVarChar(4000), `Contraseña temporal generada (expira: ${fechaExpiraFormatted}) para: ${targetUser.Nombres} ${targetUser.Apellidos} (${targetUser.Correo})`)
            .query(`
                INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
                VALUES(@Usuario, (SELECT IdUsuario FROM seg.tbUsuario WHERE Usuario = @Usuario), @Operacion, @Entidad, @Clave, @Detalle)
            `);

        console.log('✅ Contraseña temporal reseteada exitosamente (expira en 24 horas)');

        res.json({
            success: true,
            message: `Contraseña temporal generada exitosamente para ${targetUser.Usuario}`
        });

    } catch (error) {
        console.error('❌ Error reseteando contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para deshabilitar usuario (eliminación lógica sin SP)
app.post('/api/usuarios/:id/disable', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { usuarioEjecutor } = req.body;

        console.log('🚫 Deshabilitando usuario:', { userId, usuarioEjecutor });

        // Validar datos de entrada
        if (!usuarioEjecutor) {
            return res.status(400).json({
                success: false,
                message: 'Usuario ejecutor es requerido'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        await pool.request()
            .input('IdUsuario', sql.Int, userId)
            .query('UPDATE seg.tbUsuario SET Estado = 0 WHERE IdUsuario = @IdUsuario');

        await pool.request()
            .input('Usuario', sql.VarChar(50), usuarioEjecutor)
            .input('IdUsuario', sql.Int, userId)
            .input('Operacion', sql.VarChar(30), 'DISABLE_USER')
            .input('Entidad', sql.VarChar(30), 'tbUsuario')
            .input('Clave', sql.VarChar(100), `IdUsuario=${userId}`)
            .input('Detalle', sql.NVarChar(4000), 'Usuario deshabilitado')
            .query(`
                INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
                VALUES(@Usuario, (SELECT IdUsuario FROM seg.tbUsuario WHERE Usuario=@Usuario), @Operacion, @Entidad, @Clave, @Detalle)
            `);

        res.json({ success: true, message: 'Usuario deshabilitado' });

    } catch (error) {
        console.error('❌ Error deshabilitando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para rehabilitar usuario (sin SP)
app.post('/api/usuarios/:id/enable', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { usuarioEjecutor } = req.body;

        console.log('✅ Rehabilitando usuario:', { userId, usuarioEjecutor });

        // Validar datos de entrada
        if (!usuarioEjecutor) {
            return res.status(400).json({
                success: false,
                message: 'Usuario ejecutor es requerido'
            });
        }

        // Conectar a la base de datos
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        await pool.request()
            .input('IdUsuario', sql.Int, userId)
            .query('UPDATE seg.tbUsuario SET Estado = 1 WHERE IdUsuario = @IdUsuario');

        await pool.request()
            .input('Usuario', sql.VarChar(50), usuarioEjecutor)
            .input('IdUsuario', sql.Int, userId)
            .input('Operacion', sql.VarChar(30), 'ENABLE_USER')
            .input('Entidad', sql.VarChar(30), 'tbUsuario')
            .input('Clave', sql.VarChar(100), `IdUsuario=${userId}`)
            .input('Detalle', sql.NVarChar(4000), 'Usuario rehabilitado')
            .query(`
                INSERT INTO seg.tbBitacoraTransacciones(Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle)
                VALUES(@Usuario, (SELECT IdUsuario FROM seg.tbUsuario WHERE Usuario=@Usuario), @Operacion, @Entidad, @Clave, @Detalle)
            `);

        res.json({ success: true, message: 'Usuario habilitado' });

    } catch (error) {
        console.error('❌ Error rehabilitando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});





// === BITÁCORAS ===
app.get('/api/bitacora/accesos', async (req, res) => {
    try {
        const {
            rol = '', usuario = '', estado = '', fechaInicio = '', fechaFin = '',
            page = 1, limit = 10
        } = req.query;

        if (!pool) pool = await sql.connect(dbConfig);

        let where = 'WHERE 1=1';
        const r = pool.request();

        if (rol.trim()) {
            where += ' AND u.Rol = @rol';
            r.input('rol', sql.VarChar(20), rol.trim().toLowerCase());
        }
        if (usuario.trim()) {
            where += ' AND (ba.Usuario LIKE @usuario)';
            r.input('usuario', sql.VarChar(100), `%${usuario.trim()}%`);
        }
        if (estado.trim()) { // 'OK' | 'FAIL'
            where += ' AND ba.Resultado = @estado';
            r.input('estado', sql.VarChar(10), estado.trim().toUpperCase());
        }

        // Filtro de fechas mejorado
        if (fechaInicio && !fechaFin) {
            // Solo fecha inicio: mostrar solo ese día específico
            where += ' AND ba.FechaHora >= @fi AND ba.FechaHora < DATEADD(day,1,@fi)';
            r.input('fi', sql.DateTime2, new Date(fechaInicio));
        } else if (!fechaInicio && fechaFin) {
            // Solo fecha fin: mostrar hasta ese día (inclusive)
            where += ' AND ba.FechaHora < DATEADD(day,1,@ff)';
            r.input('ff', sql.DateTime2, new Date(fechaFin));
        } else if (fechaInicio && fechaFin) {
            // Ambas fechas: mostrar rango completo
            where += ' AND ba.FechaHora >= @fi AND ba.FechaHora < DATEADD(day,1,@ff)';
            r.input('fi', sql.DateTime2, new Date(fechaInicio));
            r.input('ff', sql.DateTime2, new Date(fechaFin));
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // total
        const total = (await r.query(`
            SELECT COUNT(*) total
            FROM seg.tbBitacoraAcceso ba
            INNER JOIN seg.tbUsuario u ON ba.IdUsuario = u.IdUsuario
            ${where}
        `)).recordset[0].total;

        // datos
        const r2 = pool.request();
        // repetir params
        r2.parameters = r.parameters;
        r2.input('offset', sql.Int, offset);
        r2.input('limit', sql.Int, limitNum);

        const rows = (await r2.query(`
      SELECT ba.IdAcceso, ba.FechaHora, ba.Usuario, ba.IdUsuario, ba.Resultado, u.Rol
      FROM seg.tbBitacoraAcceso ba
      INNER JOIN seg.tbUsuario u ON ba.IdUsuario = u.IdUsuario
      ${where}
      ORDER BY ba.FechaHora DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `)).recordset;

        res.json({
            success: true,
            data: rows.map(x => ({
                id: x.IdAcceso,
                fechaHora: x.FechaHora,
                usuario: x.Usuario,
                idUsuario: x.IdUsuario,
                estado: x.Resultado,
                rol: x.Rol || 'N/A'
            })),
            pagination: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems: total,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPrevPage: pageNum > 1
            },
            filters: { usuario, estado, fechaInicio, fechaFin }
        });
    } catch (err) {
        console.error('Error bitácora accesos:', err);
        res.status(500).json({ success: false, message: 'Error obteniendo bitácora de accesos' });
    }
});

app.get('/api/bitacora/transacciones', async (req, res) => {
    try {
        const {
            usuario = '', accion = '', tabla = '', fechaInicio = '', fechaFin = '',
            page = 1, limit = 10
        } = req.query;

        if (!pool) pool = await sql.connect(dbConfig);

        let where = 'WHERE 1=1';
        const r = pool.request();

        if (usuario.trim()) {
            where += ' AND (Usuario LIKE @usuario)';
            r.input('usuario', sql.VarChar(100), `%${usuario.trim()}%`);
        }
        if (accion.trim()) {
            where += ' AND (Operacion = @op)';
            r.input('op', sql.VarChar(30), accion.trim().toUpperCase());
        }
        if (tabla.trim()) {
            where += ' AND (Entidad = @ent)';
            r.input('ent', sql.VarChar(30), tabla.trim());
        }
        if (fechaInicio) {
            where += ' AND FechaHora >= @fi';
            r.input('fi', sql.DateTime2, new Date(fechaInicio));
        }
        if (fechaFin) {
            where += ' AND FechaHora < DATEADD(day,1,@ff)';
            r.input('ff', sql.DateTime2, new Date(fechaFin));
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        const total = (await r.query(`SELECT COUNT(*) total FROM seg.tbBitacoraTransacciones ${where}`)).recordset[0].total;

        const r2 = pool.request();
        r2.parameters = r.parameters;
        r2.input('offset', sql.Int, offset);
        r2.input('limit', sql.Int, limitNum);

        const rows = (await r2.query(`
      SELECT IdTransaccion, FechaHora, Usuario, IdUsuario, Operacion, Entidad, ClaveEntidad, Detalle
      FROM seg.tbBitacoraTransacciones
      ${where}
      ORDER BY FechaHora DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `)).recordset;

        res.json({
            success: true,
            data: rows.map(x => ({
                id: x.IdTransaccion,
                fechaHora: x.FechaHora,
                usuario: x.Usuario,
                idUsuario: x.IdUsuario,
                operacion: x.Operacion,
                entidad: x.Entidad,
                clave: x.ClaveEntidad,
                detalle: x.Detalle
            })),
            pagination: {
                currentPage: pageNum,
                itemsPerPage: limitNum,
                totalItems: total,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPrevPage: pageNum > 1
            },
            filters: { usuario, accion, tabla, fechaInicio, fechaFin }
        });
    } catch (err) {
        console.error('Error bitácora transacciones:', err);
        res.status(500).json({ success: false, message: 'Error obteniendo bitácora de transacciones' });
    }
});














// Endpoint para recuperación de contraseña (generar contraseña temporal)
app.post('/api/forgot-password', verifyRecaptcha, async (req, res) => {
    try {
        const { email } = req.body;

        console.log('📧 Solicitud de recuperación de contraseña para:', email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico es requerido'
            });
        }

        if (!pool) {
            pool = await sql.connect(dbConfig);
        }

        const request = pool.request();
        request.input('Correo', sql.VarChar(120), email);
        request.output('PasswordTemporal', sql.NVarChar(200));
        request.output('Mensaje', sql.NVarChar(200));

        const result = await request.execute('seg.sp_GenerarPasswordTemporal');

        const passwordTemporal = result.output.PasswordTemporal;
        const mensaje = result.output.Mensaje;

        if (result.returnValue === 0) {
            // Contraseña temporal generada exitosamente
            console.log('✅ Contraseña temporal generada para:', email);

            // Obtener datos del usuario para el correo
            const userRequest = pool.request();
            userRequest.input('Correo', sql.VarChar(120), email);

            const userResult = await userRequest.query(`
                SELECT Nombres + ' ' + Apellidos AS NombreCompleto
                FROM seg.tbUsuario
                WHERE Correo = @Correo AND Estado = 1
            `);

            const nombreCompleto = userResult.recordset.length > 0
                ? userResult.recordset[0].NombreCompleto
                : 'Usuario';

            // Enviar correo electrónico con Brevo
            const emailResult = await sendBrevoEmail(email, passwordTemporal);

            if (emailResult.success) {
                console.log('📬 Correo enviado exitosamente');

                // NUNCA mostrar la contraseña en la respuesta por seguridad
                return res.json({
                    success: true,
                    message: 'Si el correo está registrado, se ha enviado una contraseña temporal. Revisa tu bandeja de entrada.'
                });
            } else {
                console.error('❌ Error enviando correo:', emailResult.error);
                return res.status(500).json({
                    success: false,
                    message: 'Contraseña temporal generada, pero hubo un error enviando el correo'
                });
            }

        } else {
            // Error generando contraseña temporal (no revelar si el correo existe)
            console.log('❌ Error generando contraseña temporal:', mensaje);

            // Respuesta genérica por seguridad - no revelar si el correo existe
            return res.json({
                success: true,
                message: 'Si el correo está registrado, se ha enviado una contraseña temporal. Revisa tu bandeja de entrada.'
            });
        }

    } catch (error) {
        console.error('❌ Error en recuperación de contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Inicializar el servidor
async function startServer() {
    try {
        // Probar conexión a la base de datos
        console.log('Conectando a SQL Server con:', dbConfig.connectionString);
        pool = await sql.connect(dbConfig);
        console.log('✅ Conexión a SQL Server establecida');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📊 Base de datos conectada: AcademicoDB`);
            console.log(`🔐 reCAPTCHA habilitado en login y recuperación de contraseña`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejo de errores de conexión
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando servidor...');
    if (pool) {
        await pool.close();
    }
    process.exit(0);
});


startServer();
