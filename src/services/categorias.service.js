require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

// Construir cadena de conexión desde env
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

let pool;
async function getPool() {
  if (!pool) {
    pool = await sql.connect({ connectionString });
  }
  return pool;
}

/**
 * Listar categorías
 * @param {boolean} soloActivas - Filtrar solo categorías activas
 * @returns {Array} Lista de categorías
 */
async function listarCategorias(soloActivas = true) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('SoloActivas', sql.Bit, soloActivas ? 1 : 0);
    
    const result = await request.execute('com.sp_ListarCategorias');
    return result.recordset;
  } catch (error) {
    console.error('Error en listarCategorias:', error);
    throw error;
  }
}

/**
 * Obtener una categoría por ID
 * @param {number} idCategoria - ID de la categoría
 * @returns {Object|null} Categoría encontrada o null
 */
async function obtenerCategoria(idCategoria) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('IdCategoria', sql.Int, idCategoria);
    
    const result = await request.execute('com.sp_ObtenerCategoria');
    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (error) {
    console.error('Error en obtenerCategoria:', error);
    throw error;
  }
}

/**
 * Crear una nueva categoría
 * @param {string} usuario - Usuario que ejecuta la operación
 * @param {string} nombre - Nombre de la categoría
 * @param {string} descripcion - Descripción de la categoría
 * @returns {Object} Resultado de la operación
 */
async function crearCategoria(usuario, nombre, descripcion = null) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('Nombre', sql.VarChar(100), nombre);
    request.input('Descripcion', sql.VarChar(200), descripcion);
    request.output('Mensaje', sql.NVarChar(200));
    
    const result = await request.execute('com.sp_CrearCategoria');
    
    return {
      success: result.returnValue >= 0,
      idCategoria: result.returnValue,
      mensaje: result.output.Mensaje
    };
  } catch (error) {
    console.error('Error en crearCategoria:', error);
    throw error;
  }
}

/**
 * Actualizar una categoría existente
 * @param {string} usuario - Usuario que ejecuta la operación
 * @param {number} idCategoria - ID de la categoría
 * @param {string} nombre - Nuevo nombre
 * @param {string} descripcion - Nueva descripción
 * @param {boolean} activo - Estado activo/inactivo
 * @returns {Object} Resultado de la operación
 */
async function actualizarCategoria(usuario, idCategoria, nombre, descripcion = null, activo = true) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('IdCategoria', sql.Int, idCategoria);
    request.input('Nombre', sql.VarChar(100), nombre);
    request.input('Descripcion', sql.VarChar(200), descripcion);
    request.input('Activo', sql.Bit, activo ? 1 : 0);
    request.output('Mensaje', sql.NVarChar(200));
    
    const result = await request.execute('com.sp_ActualizarCategoria');
    
    return {
      success: result.returnValue === 0,
      mensaje: result.output.Mensaje
    };
  } catch (error) {
    console.error('Error en actualizarCategoria:', error);
    throw error;
  }
}

/**
 * Eliminar una categoría (física o lógicamente)
 * @param {string} usuario - Usuario que ejecuta la operación
 * @param {number} idCategoria - ID de la categoría
 * @param {boolean} eliminacionFisica - true para eliminar físicamente, false para desactivar
 * @returns {Object} Resultado de la operación
 */
async function eliminarCategoria(usuario, idCategoria, eliminacionFisica = false) {
  try {
    const p = await getPool();
    const request = p.request();
    request.input('Usuario', sql.VarChar(50), usuario);
    request.input('IdCategoria', sql.Int, idCategoria);
    request.input('EliminacionFisica', sql.Bit, eliminacionFisica ? 1 : 0);
    request.output('Mensaje', sql.NVarChar(200));
    
    const result = await request.execute('com.sp_EliminarCategoria');
    
    return {
      success: result.returnValue === 0,
      mensaje: result.output.Mensaje
    };
  } catch (error) {
    console.error('Error en eliminarCategoria:', error);
    throw error;
  }
}

module.exports = {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
};
